// BiomniBench (Phylo, Humanlaya Data Lab and xbench). xbench.org/profession/biomnibench is a single-page app
// whose results ship in its JavaScript bundle as a literal array of {model, score: "63.94 ± 0.30",
// perTaskSd, time, cost, turns}; the bundle name changes on each deploy, so the importer finds it in the
// page and locates the array by those keys, reading it as data, never running it. The score (rubric
// grade, the ranking) is the number before "±"; cost is the average per task. Metrics: the score's SD across
// runs (after "±", `sd`), Time/task in seconds (`latency`, from "8.0m") and Turns (`turns`), all from the array.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral, num } from '../lib/html.ts';

const PAGE = 'https://xbench.org/profession/biomnibench';

const board: Leaderboard = {
  benchmark: 'biomnibench',
  url: PAGE,
  feed: 'https://xbench.org/<build>/index-*.js (results array with score, perTaskSd, time, cost, turns)',
  terms: 'Data shipped in the public xbench.org bundle; robots.txt allows all paths and the site states no terms.',
  // "Qwen 3.6" could be several Qwen 3.6 models, so it is left unmatched
  aliases: {},
  async fetch() {
    const html = await fetchText(PAGE);
    const src = html.match(/src="(\/[^"]*\/index-[\w-]+\.js)"/)?.[1];
    if (!src) throw new Error('no bundle script on the xbench page');
    const js = await fetchText(new URL(src, PAGE).href);
    const at = js.search(/\[\{model:"[^"]+",score:"[^"]+",perTaskSd:/);
    if (at < 0) throw new Error('no BiomniBench results array in the xbench bundle');
    const data = jsLiteral<{ model: string; score: string; cost?: string; time?: string; turns?: string }[]>(js, at);
    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      const score = num(r.score);
      if (!r.model || score === undefined) continue;
      const metrics: Record<string, number> = {};
      const sd = num(r.score.split('±')[1]);
      if (sd !== undefined) metrics.sd = sd;
      // Time/task as "8.0m"; the unit letter scales it to seconds
      const time = r.time?.match(/([\d.]+)\s*([hms])/);
      if (time) metrics.latency = Math.round(Number(time[1]) * { h: 3600, m: 60, s: 1 }[time[2] as 'h' | 'm' | 's']);
      const turns = num(r.turns);
      if (turns !== undefined) metrics.turns = turns;
      rows.push({ model: r.model, score, cost: num(r.cost), metrics });
    }
    return rows;
  },
};
export default board;
