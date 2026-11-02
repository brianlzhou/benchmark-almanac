// StarSkirmish Bench v0.2. starskirmish.com/bench/v0-2/ draws its chart from /bench/v0-2/data.js, a plain ES
// module that calls itself "the one source for the numbers" on the page: MODELS (key -> display name),
// SCORES (per model the average win rate, 0 to 100, of its 5 bots against the roster of human-written and demo
// bots) and COSTS (mean API cost of one 1-hour run in US dollars). The score is SCORES.score. The page says
// Gemini 4 Argon ran at high reasoning effort and every other model at max, which becomes the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

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
  feed: `${FEED} (SCORES, COSTS)`,
  terms: 'Static data module on starskirmish.com; robots.txt allows all paths and the site publishes no terms of use.',
  async fetch() {
    const js = await fetchText(FEED);
    const models = exported<Record<string, { name: string }>>(js, 'MODELS');
    const scores = exported<{ k: string; score: number }[]>(js, 'SCORES');
    const costs = exported<Record<string, number>>(js, 'COSTS');
    const rows: LeaderboardRow[] = [];
    for (const s of scores) {
      const name = models[s.k]?.name;
      if (!name || typeof s.score !== 'number') continue;
      rows.push({ model: name, score: s.score, setting: /Gemini 4 Argon/.test(name) ? 'high' : 'max', cost: costs[s.k] });
    }
    return rows;
  },
};
export default board;
