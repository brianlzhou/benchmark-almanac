// RoboDx tests whether model-generated repairs pass hidden robot navigation checks.
// Table 10 gives the verified repair count over all 100 tasks. Its clustered interval applies to the 94-task main run.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.23816';
const header = ['agent', 'singles (44)', 'pairs (50)', 'main run (94)', 'behaviour-pass', 'clustered 95% CI',
  'full repair (pairs)', 'supplementary (6)', 'all tasks (100)'];
function percent(cell: string, denominator?: number) {
  const match = cell.match(/^(\d+)\/(\d+)$/);
  if (!match || !Number(match[2]) || (denominator && Number(match[2]) !== denominator)) throw new Error('Invalid verified repair count: ' + cell);
  return 100 * Number(match[1]) / Number(match[2]);
}
const board: Leaderboard = {
  benchmark: 'robodx', url: feed, feed, static: 'paper',
  terms: 'The author publishes the paper under the license linked at https://arxiv.org/abs/2611.23816.',
  aliases: {'Haiku 5.5':'claude-haiku-5-5','Sonnet 5.5':'claude-sonnet-5-5','Opus 5.5':'claude-opus-5-5'},
  parts: {singles:'Singles', pairs:'Pairs', mainRun:'Main run', supplementary:'Supplementary pairs'},
  stats: { behaviorPass: { name: 'Behavior pass rate', unit: '%', better: 'higher' }, fullRepairPairs: { name: 'Full repair pairs rate', unit: '%', better: 'higher' } },
  async fetch() {
    const table = inlinePaperTables(await paperHtml(feed)).find(t => t[0].join('|') === header.join('|'));
    if (!table) throw new Error('Missing RoboDx all-tasks repair table');
    const rows = table.slice(1).filter(r => r[8].includes('/')).map(r => {
      const [model, setting] = r[0].split(', ');
      const interval = r[5].match(/^\[([\d.]+), ([\d.]+)\]/);
      if (!setting || !interval) throw new Error('Missing RoboDx configuration or main-run interval');
      return {model, setting, trials: 1, score: percent(r[8],100), metrics: {
        singles: percent(r[1],44), pairs: percent(r[2],50), mainRun: 100 * numberCell(r[3]),
        behaviorPass: 100 * numberCell(r[4]), mainRunLow: 100 * numberCell(interval[1]),
        mainRunHigh: 100 * numberCell(interval[2]), fullRepairPairs: percent(r[6]), supplementary: 100 * numberCell(r[7]),
      }};
    });
    return checked(rows,10);
  },
};
export default board;
