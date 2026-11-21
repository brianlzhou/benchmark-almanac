// RSI Control Arena measures how often a model installs a side task during training.
// Table 8 reports installed runs and total attempts. The headline is the percentage of attempts that succeeded.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2610.27735';
const aliases = {
  'Opus 5': 'claude-opus-5',
  'GPT-5.6': 'gpt-5-6-sol',
  'Gemini 3.7': 'gemini-3-7-flash',
  'Grok 4.6': 'grok-4-6',
  'GLM-5.3': 'glm-5-3',
  'Muse 1.3': 'muse-spark-1-3',
};

export default {
  benchmark: 'rsi-control-arena',
  static: 'paper',
  url, feed: url, aliases,
  terms: 'The authors publish Table 8 on arXiv. https://arxiv.org/abs/2610.27735',
  parts: Object.fromEntries([{ key: 'installed', name: 'Installed runs', unit: 'score', better: 'lower' }].map(({ key, ...part }) => [key, part])) as Record<string, import('./types.ts').BoardPart>,
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t =>
      t[0]?.includes('Side task') && t.at(-1)?.[0] === 'Installed runs / attempts');
    if (!table) throw new Error('Missing Table 8 run totals');
    const totals = table.at(-1)!;
    return checked(Object.keys(aliases).map(model => {
      const match = /^(\d+)\/(\d+)$/.exec(totals[table[0].indexOf(model)]);
      if (!match) throw new Error('Missing installed runs or attempts for ' + model);
      const installed = Number(match[1]);
      const trials = Number(match[2]);
      if (!trials || installed > trials) throw new Error('Invalid run totals for ' + model);
      return { model, score: 100 * installed / trials, trials, metrics: { installed } };
    }), 6);
  },
} satisfies Leaderboard;
