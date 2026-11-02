// Brokk Power Ranking, now published as SlopCop's Power Ranking (brokk.ai/power-ranking redirects to
// slopcop.com/power-ranking). The server-rendered Next.js page carries the results table in its flight data
// ("table": per model configuration "<model>/<effort>", the Bradley-Terry intelligence strength bt, minutes
// per task, and tasks per $200 under a subscription and at API prices). The page states its headline
// formula, Power = 100 × (I^1 × S^0.5 × V^0.5)^(1/2), each part a fraction of the best model's; the client
// code computes I = exp(bt - best bt), S = fastest minutes / minutes and V = value / best value, with the
// subscription value where one exists and the API value otherwise (the default view). This importer repeats
// that formula; it reproduces the rendered board. The effort after the slash is the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter, nextFlight } from '../lib/html.ts';

const URL = 'https://slopcop.com/power-ranking';
const WEIGHTS = { intelligence: 1, speed: 0.5, value: 0.5 };

interface Row {
  config: string;
  bt: number | null;
  minutes?: number | null;
  apiValue?: number | null;
  subValue?: number | null;
}

const ok = (n: unknown): n is number => typeof n === 'number' && n > 0;

const board: Leaderboard = {
  benchmark: 'brokk-power-ranking',
  url: URL,
  feed: `${URL} (Next.js flight data "table", Power formula from the page)`,
  terms: 'Server-rendered page on slopcop.com; robots.txt allows all paths except /api/, /device/ and /v1/, and the site publishes no terms of use.',
  aliases: {
    'deepseek-flash-4.1-dsh': 'deepseek-v4-1-flash',
  },
  async fetch() {
    const table = jsonAfter<Row[]>(nextFlight(await fetchText(URL)), '"table":');
    const rows = table
      .map((e) => ({ ...e, value: e.subValue ?? e.apiValue }))
      .filter((e): e is Row & { bt: number; minutes: number; value: number } => typeof e.bt === 'number' && ok(e.minutes) && ok(e.value));
    if (!rows.length) throw new Error('no complete rows in the Power Ranking table');
    const bestBt = Math.max(...rows.map((e) => e.bt));
    const fastest = Math.min(...rows.map((e) => e.minutes));
    const bestValue = Math.max(...rows.map((e) => e.value));
    const total = WEIGHTS.intelligence + WEIGHTS.speed + WEIGHTS.value;
    const out: LeaderboardRow[] = [];
    for (const e of rows) {
      const log = WEIGHTS.intelligence * (e.bt - bestBt) + WEIGHTS.speed * Math.log(fastest / e.minutes) + WEIGHTS.value * Math.log(e.value / bestValue);
      const [model, setting] = e.config.split('/');
      out.push({ model, setting, score: Number((100 * Math.exp(log / total)).toFixed(1)) });
    }
    return out;
  },
};
export default board;
