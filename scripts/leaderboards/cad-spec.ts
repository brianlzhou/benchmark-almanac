// cad-spec ranks models by mean all-requirements pass rate on tiers L1 through L4.
// The official Markdown table includes bootstrap intervals, tier scores and the cost of the whole run.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = 'https://raw.githubusercontent.com/azzbilal/cad-spec/main/results/leaderboard/leaderboard.md';
const tiers = ['L0', 'L1', 'L2', 'L3', 'L4'];
const board: Leaderboard = {
  benchmark: 'cad-spec',
  url: 'https://github.com/azzbilal/cad-spec/blob/main/results/leaderboard/leaderboard.md',
  feed,
  terms: 'Public score table published by the cad-spec authors on GitHub.',
  aliases: {
    'deepseek/deepseek-chat-v3-0324': 'deepseek-v3-mar-2025',
    'mistralai/mistral-small-3.2-24b-instruct': 'mistral-small-3-2',
  },
  costPer: 'run',
  parts: Object.fromEntries(tiers.map(t => [t, t])),
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0][1] === 'Model');
    const cols = ['#', 'Model', 'Score [95% CI]', ...tiers, 'Run cost $'];
    if (!table || table.length < 17 || !cols.every((name, i) => table[0][i] === name)) throw new Error('Incomplete cad-spec table');
    return table.slice(1).map(c => {
      const score = c[2].match(/^(\d+(?:\.\d+)?)% \[(\d+(?:\.\d+)?)%, (\d+(?:\.\d+)?)%\]$/);
      if (!score || !c[1] || !c[8] || !Number.isFinite(Number(c[8]))) throw new Error('Invalid cad-spec result');
      const metrics = Object.fromEntries(tiers.map((tier, i) => {
        if (!/^\d+(?:\.\d+)?%$/.test(c[3 + i])) throw new Error('Missing cad-spec tier');
        return [tier, parseFloat(c[3 + i])];
      }));
      return { model: c[1], score: +score[1], low: +score[2], high: +score[3], cost: +c[8], setting: 'greedy', trials: 1, metrics };
    });
  },
};
export default board;
