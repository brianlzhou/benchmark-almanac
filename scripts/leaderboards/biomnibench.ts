// BiomniBench (Phylo, Humanlaya Data Lab and xbench). xbench.org/profession/biomnibench is a single-page app
// whose results ship in its JavaScript bundle as a literal array of {model, score: "63.94 ± 0.30",
// perTaskSd, time, cost, turns}; the bundle name changes on each deploy, so the importer finds it in the
// page and locates the array by those keys, reading it as data, never running it. The score (rubric
// grade, the ranking) is the number before "±"; cost is the average per task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral, num } from '../lib/html.ts';

const PAGE = 'https://xbench.org/profession/biomnibench';

const board: Leaderboard = {
  benchmark: 'biomnibench',
  url: PAGE,
  feed: 'https://xbench.org/<build>/index-*.js (results array with score, perTaskSd, time, cost, turns)',
  terms: 'Data shipped in the public xbench.org bundle; robots.txt allows all paths and the site states no terms.',
  aliases: {
    'Qwen 3.6': 'qwen-3-6-plus',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const src = html.match(/src="(\/[^"]*\/index-[\w-]+\.js)"/)?.[1];
    if (!src) throw new Error('no bundle script on the xbench page');
    const js = await fetchText(new URL(src, PAGE).href);
    const at = js.search(/\[\{model:"[^"]+",score:"[^"]+",perTaskSd:/);
    if (at < 0) throw new Error('no BiomniBench results array in the xbench bundle');
    const data = jsLiteral<{ model: string; score: string; cost?: string }[]>(js, at);
    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      const score = num(r.score);
      if (r.model && score !== undefined) rows.push({ model: r.model, score, cost: num(r.cost) });
    }
    return rows;
  },
};
export default board;
