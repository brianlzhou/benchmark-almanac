// MoReBench-Theory tests moral reasoning under five ethical frameworks. Tables 9 and 10 report overall rubric scores
// for final responses and thinking traces, plus individual framework scores and length-controlled scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2510.16380';
const board: Leaderboard = {
  benchmark: 'morebench-theory', static: 'paper', url: feed, feed,
  terms: 'The authors publish this table under the terms listed at https://arxiv.org/abs/2510.16380.',
  aliases: {'Qwen3-235B-A22B-Thinking-2507': 'qwen3-235b-a22b-thinking-jul-2025', 'Qwen3-30B-A3B-Thinking-2507': 'qwen3-30b-a3b-thinking-jul-2025'},
  parts: {},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const results = tables.filter(t => t[0]?.join('|') === 'Model|Gauthierian|Scanlonian|Benthamite|Aristotelian|Kantian|Overall|Length|Overall-LC');
    if (results.length !== 2) throw new Error('Missing MoReBench-Theory tables');
    const rows: LeaderboardRow[] = [];
    for (const [i, t] of results.entries()) {
      if (t[1]?.join('|') !== 'Model|Contractarianism|Contractualism|Act Utilitarianism|Virtue Ethics|Deontology|Score|(char.)|Score') throw new Error('Changed theory columns');
      for (const r of t.slice(2)) {
        if (!r[1] || r[0] === r[1] || r[0] === 'Average') continue;
        const model = /^\d+B-A/.test(r[0]) ? 'Qwen3-' + r[0] + '-Thinking-2507' : r[0].replace(/-high$/, '');
        const setting = (i ? 'Thinking trace' : 'Final response') + (r[0].endsWith('-high') ? ', high reasoning effort' : '');
        const metrics: Record<string,number> = {lengthChars: numberCell(r[7]), lengthControlledScore: numberCell(r[8])};
        for (let j = 1; j <= 5; j++) {
          const key = t[0][j];
          board.parts![key] = key + ' ' + t[1][j];
          metrics[key] = numberCell(r[j]);
        }
        rows.push({model, setting, metrics, score: numberCell(r[6])});
      }
    }
    return checked(rows, 28);
  },
};
export default board;
