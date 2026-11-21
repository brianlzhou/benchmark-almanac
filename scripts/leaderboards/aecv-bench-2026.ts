// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// AECV-Bench tests object counting and document QA on construction drawings.
// The results page publishes exact-match counting accuracy, counting errors and document QA accuracy in its script.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const site = 'https://aecv-bench.com/';
const pageNames: Record<string, string> = {
  'Gemini 3.5': 'Gemini 3.5 Flash', 'Qwen 3.7': 'Qwen 3.7 Plus', 'StepFun 3.7': 'StepFun Step 3.7',
  'Mistral': 'Mistral Large 3', 'Nova 2': 'Nova 2 Lite', 'Cohere': 'Cohere Command A', 'Cohere Cmd A': 'Cohere Command A',
};
const pct = (x: number) => Number((x * 100).toFixed(4));
const board: Leaderboard = {
  benchmark: 'aecv-bench-2026', url: site + '#results', feed: site,
  terms: 'AECFoundry publishes its results at https://aecv-bench.com/#results. The authors retain their rights.',
  stats: {
    meanMape: { name: 'Mean absolute percentage error', unit: '%', better: 'lower', note: 'Mean absolute percentage error for object counting.' },
    doorMape: { name: 'Door counting error', unit: '%', better: 'lower', note: 'Mean absolute percentage error for door counts.' },
    windowMape: { name: 'Window counting error', unit: '%', better: 'lower', note: 'Mean absolute percentage error for window counts.' },
    bedroomMape: { name: 'Bedroom counting error', unit: '%', better: 'lower', note: 'Mean absolute percentage error for bedroom counts.' },
    toiletMape: { name: 'Toilet counting error', unit: '%', better: 'lower', note: 'Mean absolute percentage error for toilet counts.' },
  },
  parts: {
    counting: 'Object Counting', qa: 'Document QA', door: 'Door', window: 'Window', bedroom: 'Bedroom', toilet: 'Toilet',
    spatial: 'Spatial Reasoning', ocr: 'OCR & Text', compare: 'Comparative Questions', count: 'Instance Counting',
  },
  async fetch() {
    const html = await fetchText(site);
    const bundle = html.match(/<script[^>]+src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
    if (!bundle) throw new Error('Missing results script');
    const js = await fetchText(new URL(bundle, site).href);
    const byModel = new Map<string, Record<string, number>>();
    for (const match of js.matchAll(/\{model:"([^"]+)",([^{}]*)\}/g)) {
      const model = pageNames[match[1]] ?? match[1];
      const fields = Object.fromEntries(Array.from(match[2].matchAll(/(\w+):([.\d]+)(?=,|$)/g), m => [m[1], Number(m[2])]));
      const metrics = byModel.get(model) ?? {};
      if ('accuracy' in fields) {
        for (const key of ['accuracy','door','window','bedroom','toilet']) metrics[key === 'accuracy' ? 'counting' : key] = pct(fields[key]);
      } else if ('mean' in fields && 'door' in fields) {
        for (const key of ['mean','door','window','bedroom','toilet']) metrics[key + 'Mape'] = fields[key];
      } else if ('score' in fields && match[2].includes('type:')) metrics.qa = pct(fields.score);
      else if ('spatial' in fields) {
        for (const key of ['spatial','ocr','compare','count']) metrics[key] = pct(fields[key]);
      } else continue;
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Missing results column: ' + model);
      byModel.set(model, metrics);
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, metrics] of byModel) {
      if (metrics.counting === undefined || metrics.qa === undefined) continue;
      if (Object.keys(metrics).length !== 15) throw new Error('Missing breakdown: ' + model);
      rows.push({ model, score: (metrics.counting + metrics.qa) / 2, metrics });
    }
    return checked(rows, 12);
  },
};
export default board;
