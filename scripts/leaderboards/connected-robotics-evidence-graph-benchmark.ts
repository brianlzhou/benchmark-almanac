// CREG measures how closely a model updates beliefs after each observation. The official
// leaderboard ranks by one minus mean total variation distance. It reports three seeds
// and 95% scenario-clustered bootstrap intervals. Fractions are converted to percentages.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
const feed = 'https://creg-bench.github.io/results/';
const percent = (value: string) => Number((100 * numberCell(value)).toFixed(4));
const board: Leaderboard = {
  benchmark: 'connected-robotics-evidence-graph-benchmark', feed, url: feed,
  terms: 'The CREG team publishes the leaderboard under the MIT license. https://creg-bench.github.io/results/',
  async fetch() {
    const t = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') ===
      '#|System|Condition|Trajectory score ▼|95% CI|Strict state acc.|Grounding|Strict valid');
    if (!t) throw new Error('Missing trajectory leaderboard');
    return checked(t.slice(1).map(row => {
      const c = row.map(cell => cell.text);
      const model = c[1].replace(/ (?:Ablation|Core|Diagnostic|Community)(?: †)?$/, '');
      const m = c[4].match(/^\[([\d.]+), ([\d.]+)\]$/);
      if (!m) throw new Error('Missing trajectory interval');
      return { model, setting: c[2], trials: 3, score: percent(c[3]), low: percent(m[1]), high: percent(m[2]),
        metrics: {strictStateAcc: percent(c[5]), grounding: percent(c[6]), strictValid: percent(c[7])}};
    }), 12);
  },
};
export default board;
