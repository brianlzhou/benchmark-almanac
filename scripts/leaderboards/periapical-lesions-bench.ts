// Periapical Lesions Bench scores perfect lesion reports on 100 dental films using three attempts per film.
// The table labels the additional rates pass@2 and pass@3.
// The author's project page publishes pass@1, two further pass rates, mean reward and cost per attempt.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const url = 'https://dylantirandaz.com/projects.html/periapicalbench/';
const board: Leaderboard = {
  benchmark: 'periapical-lesions-bench', url, feed: url,
  terms: 'Public results table credited to Dylan Tirandaz.',
  stats: { pass2: { name: 'Pass@2', unit: '%', better: 'higher' }, pass3: { name: 'Pass@3', unit: '%', better: 'higher' }, meanReward: { name: 'Mean reward', unit: 'score', better: 'higher' } },
  async fetch() {
    const t = tables(await fetchText(url)).find(t => t[0]?.map(c => c.text).join('|') === 'Model|pass@1|pass@2|pass@3|Mean reward|Cost per attempt');
    if (!t || t.length < 9) throw new Error('Incomplete periapical benchmark table');
    return t.slice(1).map(c => {
      const [score, passAt2, passAt3, meanReward, cost] = c.slice(1).map(v => num(v.text));
      if (!c[0].text || score === undefined || passAt2 === undefined || passAt3 === undefined || meanReward === undefined || cost === undefined) throw new Error('Missing periapical result');
      return { model: c[0].text, score, cost, trials: 3, metrics: { passAt2, passAt3, meanReward } };
    });
  },
};
export default board;
