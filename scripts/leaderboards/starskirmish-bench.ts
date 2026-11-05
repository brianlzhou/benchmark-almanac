// StarSkirmish Bench v0.2. starskirmish.com/bench/v0-2/ draws its chart from /bench/v0-2/data.js, a plain ES
// module that calls itself "the one source for the numbers" on the page: MODELS (key -> display name),
// SCORES (per model the average win rate, 0 to 100, of its 5 bots against the roster of human-written and demo
// bots) and COSTS (mean API cost of one 1-hour run in US dollars). The score is SCORES.score. The page's chart
// note gives the reasoning effort ("Gemini 4 Argon runs at high ...; every other model runs at max"), which
// is read from the page and becomes the setting. Metrics: PRACTICE, the median (over a model's 5 runs) of the
// practice games its agent played against the 7 strongest roster bots (`practice`), which the page's "Win Rates vs.
// Practice Against Strong Bots" scatter plots against the score, and the lowest and highest of the 5 runs' win
// rates in RUNS (`runMin`, `runMax`), the page's run-to-run variance chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral, text } from '../lib/html.ts';

const PAGE = 'https://starskirmish.com/bench/v0-2/';
const FEED = 'https://starskirmish.com/bench/v0-2/data.js';

/** The literal after `export const <name> =`. */
function exported<T>(js: string, name: string): T {
  const at = js.indexOf(`export const ${name} =`);
  if (at < 0) throw new Error(`${name} not found in StarSkirmish data.js`);
  const from = at + `export const ${name} =`.length;
  return jsLiteral<T>(js, from + js.slice(from).search(/[[{]/));
}

const board: Leaderboard = {
  benchmark: 'starskirmish-bench',
  url: PAGE,
  feed: `${FEED} (SCORES, COSTS, PRACTICE, RUNS)`,
  terms: 'Static data module on starskirmish.com; robots.txt allows all paths and the site publishes no terms of use.',
  chart: {
    title: 'Win Rates vs. Practice Against Strong Bots',
    note: "Each point is one model: the median, over its 5 runs, of the practice games its agent played in the hour against the 7 strongest roster bots, against the model's win rate.",
    x: { key: 'practice', label: 'Practice games against the 7 strongest roster bots (median run)', unit: 'games' },
    y: { key: 'score', label: 'Win rate', unit: '%', better: 'higher' },
  },
  async fetch() {
    const [js, html] = await Promise.all([fetchText(FEED), fetchText(PAGE)]);
    const note = text(html.match(/<p class="aa-note">([\s\S]*?)<\/p>/)?.[1] ?? '');
    const others = note.match(/every other model runs at (\w+)/)?.[1];
    const named = new Map([...note.matchAll(/([A-Z][\w.]*(?: [\w.]+)*?) runs at (\w+)/g)].map((m) => [m[1], m[2]]));
    const models = exported<Record<string, { name: string }>>(js, 'MODELS');
    const scores = exported<{ k: string; score: number }[]>(js, 'SCORES');
    const costs = exported<Record<string, number>>(js, 'COSTS');
    const practice = exported<Record<string, number>>(js, 'PRACTICE');
    const runs = exported<Record<string, number[]>>(js, 'RUNS');
    const rows: LeaderboardRow[] = [];
    for (const s of scores) {
      const name = models[s.k]?.name;
      if (!name || typeof s.score !== 'number') continue;
      const metrics: Record<string, number> = {};
      if (typeof practice[s.k] === 'number') metrics.practice = practice[s.k];
      const r = (runs[s.k] ?? []).filter((x) => typeof x === 'number');
      if (r.length) Object.assign(metrics, { runMin: Math.min(...r), runMax: Math.max(...r) });
      rows.push({ model: name, score: s.score, setting: named.get(name) ?? others, cost: costs[s.k], metrics });
    }
    return rows;
  },
};
export default board;
