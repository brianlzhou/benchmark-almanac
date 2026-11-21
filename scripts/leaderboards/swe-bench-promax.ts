// SWE-Bench ProMax measures the percentage of repository issues a coding agent resolves.
// Table 3 reports overall and per-language resolve rates, average steps and cost per issue.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2608.09802';
const parts = {Py: 'Python', Java: 'Java', TS: 'TypeScript', Go: 'Go', C: 'C', 'C++': 'C++', Rust: 'Rust'};
const board: Leaderboard = {
  benchmark: 'swe-bench-promax', static: 'paper', url: feed, feed, parts,
  stats: { steps: { name: 'Average steps', unit: 'count', better: 'lower' } },
  terms: 'The authors publish Table 3 under the license on the arXiv record. https://arxiv.org/abs/2608.09802',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.slice(1,5).join('|') === 'Overall|Avg. Steps|Avg. Cost|Per-Language Resolve Rate');
    if (!table || table[1].slice(4).join('|') !== Object.keys(parts).join('|')) throw new Error('Missing ProMax columns');
    let harness = '', open = false;
    const rows: LeaderboardRow[] = [];
    for (const [model, overall, steps, cost, ...scores] of table.slice(2)) {
      if (model === 'Mini-SWE-Agent' || model === 'OpenHands') { harness = model; continue; }
      if (model === 'Open-weight' || model === 'Proprietary') { open = model === 'Open-weight'; continue; }
      if (!harness || !cost.startsWith('$') || scores.length !== 7) throw new Error('Unexpected ProMax result');
      rows.push({model, harness, open, score: numberCell(overall), cost: numberCell(cost.slice(1)),
        metrics: {steps: numberCell(steps), ...Object.fromEntries(Object.keys(parts).map((key, i) => [key, numberCell(scores[i])]))}});
    }
    return checked(rows, 12);
  },
};
export default board;
