// MarketShift tests negotiation and planning when market conditions change.
// The authors say the overall score uses working capital and bargaining and "averages each task's attempts first, so every task counts once."
// Read the Results tables and the 95% interval whiskers in the overall score chart.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://anushaacharya.com/writing/how-agents-fail-to-plan';
function chartIntervals(page: string) {
  const chart = page.match(/<svg\b[^>]*aria-labelledby="wc-chart-wide"[^>]*>([\s\S]*?)<\/svg>/)?.[1];
  if (!chart) throw new Error('Missing overall interval chart');
  const ticks = new Map([...chart.matchAll(/<text\b([^>]*)>(\d+)%<\/text>/g)]
    .filter(m => m[1].includes('text-anchor="middle"')).map(m => [m[2], Number(m[1].match(/\bx="([\d.]+)"/)?.[1])]));
  const zero = ticks.get('0')!, span = ticks.get('100')! - zero;
  if (!(span > 0)) throw new Error('Missing overall chart scale');
  const intervals = new Map<string, number[]>();
  for (const group of chart.matchAll(/<g>([\s\S]*?)<\/g>/g)) {
    if (!group[1].includes('<rect')) continue;
    const model = group[1].match(/<text[^>]*>([^<]+)<\/text>/)?.[1];
    const line = group[1].match(/<line\b[^>]*>/)?.[0];
    if (!model || !line) throw new Error('Missing interval');
    intervals.set(model, ['x1','x2'].map(key => {
      const x = Number(line.match(new RegExp(key + '="([\\d.]+)"'))?.[1]);
      return Math.round(100 * (x - zero) / span);
    }));
  }
  return intervals;
}
const board: Leaderboard = {
  benchmark: 'parley-labs-negotiation', url, feed: url,
  terms: 'Parley Labs publishes its results and licenses the sample for evaluation. https://github.com/Parley-Labs/negotiation-sample/blob/main/LICENSE',
  headline: 'The authors count each working-capital and bargaining task once. Planning ahead and restraint are reported separately.',
  parts: { capital: 'Working capital', bargaining: 'Bargaining under pressure', planning: 'Planning ahead', restraint: 'Restraint' },
  stats: { paired: { name: 'Pairs with both halves passed', unit: 'count', better: 'higher' },
    pairs: { name: 'Scored pairs', unit: 'count' }, capitalLow: { name: 'Working capital 95% lower bound', unit: '%' },
    capitalHigh: { name: 'Working capital 95% upper bound', unit: '%' } },
  async fetch() {
    const page = await fetchText(url);
    const intervals = chartIntervals(page);
    const all = tables(page).map(t => t.map(r => r.map(c => c.text)));
    const main = all.find(t => t[0].join('|') === 'Model|Working capital (of 48)|95% interval|Both halves of a pair (of 24)|Bargaining (passes of 48 runs)|Overall');
    const checks = all.find(t => t[0].join('|') === 'Model|Planning ahead (of 16, one attempt)|Restraint (passes of 12 runs, two attempts)');
    if (!main || !checks) throw new Error('Missing MarketShift results columns');
    return checked(main.slice(1).map(([model, capital, bounds, paired, bargain, overall]) => {
      const aux = checks.find(r => r[0] === model);
      const range = intervals.get(model);
      const score = parseFloat(overall);
      if (!aux || !range || !(range[0] <= score && score <= range[1])) throw new Error('Missing MarketShift result for ' + model);
      const [capitalLow, capitalHigh] = bounds.split('–').map(parseFloat);
      const metrics = { capital: Number(capital.match(/\((\d+)%\)/)?.[1]), capitalLow, capitalHigh,
        paired: parseInt(paired), pairs: Number(paired.match(/of (\d+)/)?.[1] ?? 24),
        bargaining: 100 * Number(bargain) / 48, planning: 100 * Number(aux[1]) / 16, restraint: 100 * Number(aux[2]) / 12 };
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid MarketShift metric for ' + model);
      return { model, harness: 'terminus-2', score, low: range[0], high: range[1], metrics };
    }), 7);
  },
};
export default board;
