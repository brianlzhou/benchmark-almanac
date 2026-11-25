// RD-Bench tests ten decisions about research. Table 2 gives held-out top-1 accuracy across all ten types.
// The two 0.6B DCRM variants average three training seeds. Top-3 is candidate ranking accuracy.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.00774';
const decisionTypes = [
  'Research stage', 'State completeness', 'Evidence sufficiency', 'Claim-evidence consistency',
  'Next action', 'Stopping condition', 'Direction decision', 'Model routing',
  'Advisor review need', 'User confirmation need',
];
const board: Leaderboard = {
  benchmark: 'research-decision-benchmark', url: feed, feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: Object.fromEntries(decisionTypes.flatMap(name => [
    [name, { name, group: 'Top-1' }],
    [`${name}: Top-3`, { name, group: 'Top-3' }],
  ])),
  stats: {
    top3: { name: 'Top-3 accuracy', unit: '%', better: 'higher' },
  },
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === '|DCRM (state-aware)|DCRM (state-aware)|DCRM (question-only)|DCRM (question-only)|DeepSeek- V4.1-Flash|Gain'
      && t[1]?.join('|') === 'Decision type|Top-1|Top-3|Top-1|Top-3|Top-1|(pp)');
    if (table?.length !== 13 || table.at(-1)?.[0] !== 'All ten types') throw Error('RD-Bench Table 2 changed');
    const detail = table.slice(2, -1);
    function percent(cell: string) {
      const match = cell.match(/^(0\.\d+|1\.0+)(?: †)?$/);
      if (!match) throw Error('Invalid accuracy: ' + cell);
      return Number((Number(match[1]) * 100).toFixed(3));
    }
    return checked([1, 3, 5].map(col => {
      const model = table[0][col].replace('- ', '-');
      const metrics: Record<string, number> = {};
      for (const c of detail) {
        metrics[c[0]] = percent(c[col]);
        if (col < 5) metrics[c[0] + ': Top-3'] = percent(c[col + 1]);
      }
      const total = table.at(-1)!;
      if (col < 5) metrics.top3 = percent(total[col + 1]);
      return { model, score: percent(total[col]), metrics, ...(col < 5 ? { trials: 3 } : {}) };
    }), 3);
  },
};
export default board;
