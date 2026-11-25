// SimReadyBench names formal fidelity on the NV100 assets as its primary metric.
// The card distinguishes pass@1, pass@3 and pass^3.
// Its Hugging Face card reports configuration scores, measurement ranges, cost, time and output tokens per asset.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const url = 'https://huggingface.co/datasets/hcltech-robotics/simreadybench';
const feed = url + '/raw/main/README.md';
const cols = ['Model', 'Reasoning', 'Harness', 'Formal %', 'Optional criteria (%)', 'Visual %', 'Kinematic %', 'pass@1 %', 'pass@3 %', 'pass^3 %', 'Tokens/asset', 'Inference $/asset', '$/formal point', 'Trial min/asset'];
const measureKeys: Record<string, string> = { 'pass@1 %': 'passAt1', 'pass@3 %': 'passAt3', 'pass^3 %': 'pass3', 'Tokens/asset': 'totalTokens' };
const n = (s: string) => Number(s.replace(/[$,]/g, ''));
const board: Leaderboard = {
  benchmark: 'simreadybench-nv100', url: url + '#leaderboard', feed,
  terms: 'Public result tables on the HCLTech Robotics dataset card. The card links separate NVIDIA asset terms.',
  stats: {
    'Optional criteria (%)': { name: 'Optional criteria passed', unit: '%', better: 'higher', note: 'Percentage of optional checks passed.' },
    'Visual %': { name: 'Visual fidelity', unit: '%', better: 'higher' },
    'Kinematic %': { name: 'Kinematic fidelity', unit: '%', better: 'higher' },
    passAt1: { name: 'pass@1', unit: '%', better: 'higher', note: 'Percentage of assets passing all mandatory checks in one attempt.' },
    passAt3: { name: 'pass@3', unit: '%', better: 'higher', note: 'Probability of at least one pass in three attempts.' },
    pass3: { name: 'pass^3', unit: '%', better: 'higher', note: 'Probability that all three sampled attempts pass, averaged per object.' },
    totalTokens: { name: 'Tokens per asset', unit: 'tokens' },
    'Inference $/asset': { name: 'Inference cost per asset', unit: 'usd', better: 'lower' },
    '$/formal point': { name: 'Cost per formal point', unit: 'usd', better: 'lower' },
    'Trial min/asset': { name: 'Trial time per asset', unit: 'minutes', better: 'lower' },
    latency: { name: 'Latency per asset', unit: 'seconds', better: 'lower' },
  },
  aliases: { 'NVIDIA Nemotron 3.5 Super VL': 'nemotron-3-5-super-vl', 'ChatGPT 6.1 Sol': 'gpt-6-1-sol', 'ChatGPT 6.1 Terra': 'gpt-6-1-terra', 'ChatGPT 6.2 Astra': 'gpt-6-2-astra' },
  async fetch() {
    const tables = markdownTables(await fetchText(feed));
    const board = tables.find(t => cols.every((k, i) => t[0][i] === k));
    const usage = tables.find(t => t[0][5] === 'Output' && t[0][6] === 'Cached input');
    if (!board || board.length < 14 || !usage) throw new Error('Incomplete SimReadyBench leaderboard');
    return board.slice(1).map(c => {
      const u = usage.find(row => row.slice(0, 3).every((k, i) => k === c[i]));
      const metrics: Record<string, number> = {};
      for (let i = 4; i < cols.length; i++) {
        const values = c[i]?.split('–').map(n);
        if (!values?.length || !values.every(Number.isFinite)) throw new Error('Invalid SimReadyBench measure ' + cols[i]);
        const key = measureKeys[cols[i]] ?? cols[i];
        if (values.length === 1) metrics[key] = values[0];
        else { metrics[key + ' low'] = values[0]; metrics[key + ' high'] = values[1]; }
      }
      const score = n(c[3]);
      if (!c[0] || !Number.isFinite(score)) throw new Error('Missing formal fidelity');
      metrics.latency = metrics['Trial min/asset'] * 60;
      return { model: c[0], setting: c[1], harness: c[2], score, cost: metrics['Inference $/asset'],
        tokens: u && Number.isFinite(n(u[5])) ? n(u[5]) : undefined, metrics };
    });
  },
};
export default board;
