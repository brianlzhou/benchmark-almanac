// SPM-Bench tests reasoning about scanning probe microscopy images.
// Table 3 compares models by SIP-F1, with exact match and partial credit beside it.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2602.22971';
export default {
  benchmark: 'spm-bench', url: feed, feed, static: 'paper',
  terms: 'The paper and its license are linked at https://arxiv.org/abs/2602.22971',
  stats: {
    EM: { name: 'Exact match', unit: 'score', better: 'higher' },
    SPC: { name: 'Standard partial credit', unit: 'score', better: 'higher' },
    delta: { name: 'Standard partial credit to strict imperfection F1 gap', unit: 'score', note: 'Absolute difference between Standard Partial Credit and Strict Imperfection Penalty F1.' },
  },
  aliases: { 'gpt-5.2-1211-global': 'gpt-5-2', 'gpt-5.1-1113-global': 'gpt-5-1',
    'gemini-2.5-flash-image-preview': 'gemini-2-5-flash-image-preview-nano-banana' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0].join('|') === 'Model|EM|SPC|SIP-F1|\\Delta|Personality');
    if (!table) throw new Error('Missing Table 3');
    return checked(table.slice(1).map(([model,em,spc,f1,delta]) => ({
      model, score: numberCell(f1), metrics: { EM: numberCell(em), SPC: numberCell(spc), delta: numberCell(delta) },
    })), 17);
  },
} satisfies Leaderboard;
