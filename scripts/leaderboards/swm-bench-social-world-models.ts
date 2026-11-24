// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// SWM-Bench tests predictions of market belief changes. Table 2 lists mean absolute scaled error (MASE) first.
// The headline uses both full test sets. The attributed subsets overlap those sets and the hindsight posterior is an oracle.
import type { Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2606.11482';
const markets = ['Polymarket','Kalshi'];
const measures = ['MASE','MAE','DA','Corr'];
const columns = markets.flatMap(market => measures.flatMap(measure => ['All','Attr'].map(split => ({ market, measure, key: market + ': ' + measure + ' (' + split + ')' }))));
const board: Leaderboard = {
  benchmark: 'swm-bench-social-world-models', url: feed, feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'This is the plain mean of the full Polymarket and Kalshi test sets’ MASE, the first reported metric. Lower is better.',
  parts: Object.fromEntries(columns.map(({key,measure}) => [key, { name: key, unit: measure === 'DA' ? '%' : 'score',
    better: ['MAE','MASE'].includes(measure) ? 'lower' : 'higher' }])),
  async fetch() {
    const t = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === ['Method',...columns.map(c => c.market)].join('|') &&
      t[1]?.map(s => s.split('\\')[0]).join('|') === ['Method',...columns.map(c => c.measure)].join('|') &&
      t[2]?.join('|') === 'Method|' + Array(8).fill('All|Attr').join('|'));
    if (!t) throw Error('Missing SWM-Bench Table 2');
    const rows = t.slice(3).filter(c => !c.every(s => s === c[0]) && c[0] !== 'SWM (posterior)').map(([name,...cells]) => {
      if (cells.length !== 16 || !cells.every(s => /^-?\d*\.\d+$/.test(s))) throw Error('Invalid SWM-Bench result');
      const metrics = Object.fromEntries(columns.map(({key,measure},i) => [key,Number(cells[i]) * (measure === 'DA' ? 100 : 1)]));
      const model = name.replace(/-think$/, '');
      const setting = name.endsWith('-think') ? 'Thinking' : name === 'Qwen3-8B' ? 'Non-thinking' : undefined;
      return { model, setting, metrics, score: (Number(cells[0]) + Number(cells[8]))/2 };
    });
    return checked(rows, 17);
  },
};
export default board;
