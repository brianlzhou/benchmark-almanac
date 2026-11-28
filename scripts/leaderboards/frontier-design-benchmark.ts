// Frontier Design Benchmark (Contra Labs and BenchFlow): professional designers on Contra vote blind between two
// outputs for the same real client brief. Read from the data file its page loads (window.FDB_OURS in data/fdb.js):
// each entry's Elo with its interval half-width, win rate with its 95% interval, games, and cost. The "Human golden"
// entry is the designers' own work, not a model, so it is left out. A stealth model ("Gestalt") has no model record and
// shows as an unlisted entry.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://contralabs.com/frontierdesign';
const FEED = 'https://contralabs.com/frontierdesign/data/fdb.js';
interface Entry { name: string; org?: string; elo: number; ci?: number; win?: number; winLo?: number; winHi?: number; games?: number; golden?: boolean; cost?: number | null }

// The data file is minified JavaScript (since November 19, 2026), not JSON: bare keys, !0 and !1 for true and false,
// and numbers like .89. These two helpers turn one array literal into JSON, walking it so text inside strings stays.
function closeOf(s: string, open: number): number {
  let depth = 0;
  let q = '';
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '\\') i++;
      else if (c === q) q = '';
    } else if (c === '"' || c === "'") q = c;
    else if (c === '[' || c === '{') depth++;
    else if ((c === ']' || c === '}') && --depth === 0) return i;
  }
  throw new Error('Frontier Design Benchmark: unclosed array');
}
function literalToJson(s: string): string {
  let out = '';
  let q = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      out += c;
      if (c === '\\') out += s[++i];
      else if (c === q) q = '';
      continue;
    }
    if (c === '"') {
      q = c;
      out += c;
      continue;
    }
    const key = /^[A-Za-z_$][\w$]*(?=:)/.exec(s.slice(i));
    if (key && /[{,]$/.test(out)) {
      out += `"${key[0]}"`;
      i += key[0].length - 1;
    } else if (c === '!' && (s[i + 1] === '0' || s[i + 1] === '1')) {
      out += s[i + 1] === '0' ? 'true' : 'false';
      i++;
    } else if (c === '.' && /[:,[-]$/.test(out)) out += '0.';
    else out += c;
  }
  return out;
}

const board: Leaderboard = {
  benchmark: 'frontier-design-benchmark',
  costPer: 'run',
  url: PAGE,
  feed: `${FEED} (window.FDB_OURS.models)`,
  terms: 'robots.txt allows the site. Contra Labs states no data license. Results are credited to Contra Labs and BenchFlow.',
  measures: { winRate: 'win-rate' },
  stats: { winRate: { name: 'Win rate', unit: '%', better: 'higher' }, games: { name: 'Games', unit: 'count' }, cost: { name: 'Cost per run', unit: 'usd', better: 'lower' } },
  aliases: { 'Muse Wonder': 'muse-wonder', 'Qwen3.8 Max': 'qwen-3-8-max' },
  async fetch() {
    const js = await fetchText(FEED);
    const at = js.indexOf('models:[');
    if (at < 0) throw new Error('Frontier Design Benchmark: no models array in the data file');
    const models = JSON.parse(literalToJson(js.slice(at + 7, closeOf(js, at + 7) + 1))) as Entry[];
    const rows: LeaderboardRow[] = models
      .filter((m) => !m.golden && Number.isFinite(m.elo))
      .map((m) => ({
        model: m.name,
        score: m.elo,
        ...(m.ci ? { low: m.elo - m.ci, high: m.elo + m.ci } : {}),
        ...(typeof m.cost === 'number' && Number.isFinite(m.cost) && m.cost > 0 ? { cost: m.cost } : {}),
        metrics: {
          ...(Number.isFinite(m.win) ? { winRate: m.win! } : {}),
          ...(Number.isFinite(m.winLo) ? { winRateLow: m.winLo!, winRateHigh: m.winHi! } : {}),
          ...(Number.isFinite(m.games) ? { games: m.games! } : {}),
          ...(Number.isFinite(m.cost) ? { cost: m.cost! } : {}),
        },
      }));
    if (rows.length < 10) throw new Error(`Frontier Design Benchmark: ${rows.length} models, expected at least 10`);
    return rows;
  },
};
export default board;
