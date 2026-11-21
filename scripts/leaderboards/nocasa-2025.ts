// NOCASA ranks speech assessment systems by unweighted average recall across pronunciation ratings.
// The organizers publish two baselines and the top two entrants in Table 2 of their challenge report.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = 'https://arxiv.org/html/2504.20678';
const board: Leaderboard = {
  benchmark: 'nocasa-2025', static: 'paper',
  url: 'https://www.codabench.org/competitions/6965/',
  feed,
  terms: 'The CodaBench page returns a challenge and its robots URL serves HTML. The organizers publish these test results in their challenge report on arXiv.',
  stats: {
    accuracy: { name: 'Accuracy', unit: '%', better: 'higher' },
    mae: { name: 'Mean absolute error', unit: 'score', better: 'lower' },
  },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === 'System|UAR, %|ACC, %|MAE');
    if (!table || table.length < 5) throw new Error('Missing NOCASA test results');
    return table.slice(1).map(c => {
      const interval = c[1].text.match(/^([\d.]+) \(([\d.]+) [–-] ([\d.]+)\)$/);
      const accuracy = num(c[2]?.text), mae = num(c[3]?.text);
      if (!interval || accuracy === undefined || mae === undefined) throw new Error('Incomplete NOCASA results');
      return { model:c[0].text, score:Number(interval[1]), low:Number(interval[2]), high:Number(interval[3]), metrics:{accuracy, mae} };
    });
  },
};
export default board;
