// PokéAgent tests competitive Pokémon battling and RPG speedrunning. The tracks use different units.
// The archived qualifying leaderboard ranks the first battling format, Gen 1 OU, by History Rating.
// Join Gen 9 OU ratings when the same named policy appears there.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://pokeagent.github.io/leaderboard.html';
const feed = 'https://pokeagent.github.io/leaderboard/track1_qualifying.json';
type Entry = {
  username: { display: string; is_starter_kit: boolean };
  elo: string; glicko: string; gxe: string; wins: string; losses: string;
  whr: { whr_elo: number; whr_std: number; whr_ci_lower: number; whr_ci_upper: number; games_played: number };
};
const fields = { HistoryRating: 'History Rating', Elo: 'Elo', Glicko: 'Glicko-1', GXE: 'GXE', Wins: 'Wins', Losses: 'Losses',
  Std: 'History Rating standard deviation', Low: 'History Rating interval lower limit', High: 'History Rating interval upper limit' };
const formats = { gen1ou: 'Gen 1 OU', gen9ou: 'Gen 9 OU' };
const board: Leaderboard = {
  benchmark: 'pokeagent-challenge', url, feed,
  terms: 'The organizers publish this snapshot on GitHub Pages (https://docs.github.com/en/site-policy/github-terms/github-terms-of-service).',
  headline: 'The tracks use different units, so the headline is the Gen 1 OU battling qualifier’s History Rating.',
  parts: Object.fromEntries(Object.entries(formats).flatMap(([f,group]) => Object.entries(fields).map(([k,name]) =>
    [f+k,{ name, group, unit: k === 'GXE' ? '%' : k === 'Elo' ? 'elo' : ['Wins','Losses'].includes(k) ? 'score' : 'rating' }]))),
  async fetch() {
    const { formats: ladders } = await fetchJson<{formats:Record<string,Entry[]>}>(feed);
    const rows = new Map<string,LeaderboardRow>();
    for (const f of Object.keys(formats)) {
      for (const entry of ladders[f]) {
        const model = entry.username.display;
        if (!(entry.username.is_starter_kit && model.startsWith('Metamon-')) && model !== 'FoulPlay') continue;
        const w = entry.whr;
        if (f === 'gen1ou') rows.set(model, { model, score: w.whr_elo, trials: w.games_played, metrics: {},
          ...(model === 'FoulPlay' ? { submitter: 'FoulPlay' } : {}) });
        const row = rows.get(model);
        if (!row) continue;
        const values = { HistoryRating: w.whr_elo, Elo: Number(entry.elo), Glicko: Number(entry.glicko),
          GXE: parseFloat(entry.gxe), Wins: Number(entry.wins), Losses: Number(entry.losses),
          Std: w.whr_std, Low: w.whr_ci_lower, High: w.whr_ci_upper };
        for (const [k,v] of Object.entries(values)) {
          if (!Number.isFinite(v)) throw new Error('Missing ' + k + ' for ' + model);
          row.metrics![f+k] = v;
        }
        if (f === 'gen1ou' && w.whr_ci_lower <= row.score && row.score <= w.whr_ci_upper) {
          row.low = w.whr_ci_lower;
          row.high = w.whr_ci_upper;
        }
      }
    }
    return checked([...rows.values()], 18);
  },
};
export default board;
