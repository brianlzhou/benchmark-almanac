// PARADE tests whether audio-language models avoid stereotypes about occupation and social status.
// AHELM reports exact match overall and for each combination of voice and question subset.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { HELM_BUCKET, helmNewest } from './helm-capabilities.ts';
import corebench from './corebench-conversational-reasoning.ts';

interface Cell { value: string | number; run_spec_names?: string[] }
interface Table { title: string; header: Cell[]; rows: Cell[][] }
const board: Leaderboard = {
  benchmark: 'parade-audio', host: 'AHELM', url: 'https://crfm.stanford.edu/helm/audio/latest/#/groups/parade',
  feed: HELM_BUCKET + '/audio/benchmark_output/runs/<newest>/groups/parade.json',
  terms: 'Stanford publishes HELM under the terms at https://github.com/stanford-crfm/helm/blob/main/LICENSE.',
  aliases: corebench.aliases,
  stats: {
    inputTokens: { name: 'Input tokens', unit: 'tokens' },
    outputTokens: { name: 'Output tokens', unit: 'tokens' },
  },
  async fetch() {
    const prefix = await helmNewest('audio', 'runs');
    const tables = await fetchJson<Table[]>(HELM_BUCKET + '/' + prefix + 'groups/parade.json');
    const main = tables.find(t => t.title === 'PARADE');
    if (!main || main.header[1]?.value !== 'EM') throw new Error('PARADE exact match column missing');
    const subsets = tables.filter(t => /^subset: (occupation|status), voice: (female|male)$/.test(t.title));
    if (new Set(subsets.map(t => t.title)).size !== 4 || subsets.some(t => t.header[1]?.value !== 'EM')) throw new Error('PARADE subsets changed');
    const parts = subsets.map(t => {
      const [, subset, voice] = t.title.match(/^subset: (\w+), voice: (\w+)$/)!;
      return { key: subset + '_' + voice, name: subset + ', ' + voice + ' voice', scores: new Map(t.rows.map(r => [r[0].value, r[1].value])) };
    });
    board.parts = Object.fromEntries(parts.map(p => [p.key, p.name]));
    const rows = main.rows.map(row => {
      const id = row[1].run_spec_names?.[0]?.split(':model=')[1]?.replace(/^[^_]+_/, '');
      if (!id || typeof row[1].value !== 'number') throw new Error('PARADE score or model missing');
      const blend = id.match(/^(.+)_(gpt-4o-2024-11-20)$/);
      const metrics: Record<string, number> = {};
      for (const { key, scores } of parts) {
        const score = scores.get(row[0].value);
        if (typeof score !== 'number') throw new Error('Missing PARADE subset score');
        metrics[key] = score * 100;
      }
      for (const [column, key] of [['# prompt tokens', 'inputTokens'], ['# output tokens', 'outputTokens']]) {
        const value = row[main.header.findIndex(c => c.value === column)]?.value;
        if (typeof value === 'number') metrics[key] = value;
      }
      return { model: blend?.[2] ?? id, ...(blend ? { models: [blend[2], blend[1]], harness: blend[1] + ' transcription' } : {}),
        score: row[1].value * 100, metrics, tokens: metrics.outputTokens };
    });
    return checked(rows, 17);
  },
};
export default board;
