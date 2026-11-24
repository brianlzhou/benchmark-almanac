// Dubesor fits a puzzle performance rating against Lichess difficulty, counting first-try solves.
// The chess data file contains every attempt. The fit adds one virtual win and loss at 1500, as the board does.
// The default table requires 100 attempts. Three optional time controls limit tokens per move.
import type { Leaderboard } from './types.ts';
import type { LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

interface Puzzles { fields: string[]; rows: (number | string | null)[][]; dicts: Record<string,string[]>; puzzles: Record<string,[number,string]> }
interface Attempt { id: string; rating: number; outcome: number; cost: number | null; tokens: number | null; ms: number | null;
  calls: number; correct: number; total: number; illegal: number; strikes: number; date: string }
const pct = (n: number, d: number) => Math.round(1000 * n / d) / 10;
function performance(ratings: number[], solved: number) {
  const opponents = [...ratings, 1500, 1500];
  const expected = (r: number, opponent: number) => 1 / (1 + 10 ** ((opponent - r) / 400));
  let low = -1000, high = 5000;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (opponents.reduce((sum, opponent) => sum + expected(mid, opponent), 0) < solved + 1) low = mid;
    else high = mid;
  }
  const r = (low + high) / 2;
  const info = opponents.reduce((sum, opponent) => { const p = expected(r, opponent); return sum + p * (1-p); }, 0);
  const ci = Math.round(1.96 * 400 / (Math.LN10 * Math.sqrt(info)));
  const score = Math.round(r);
  return { score, low: score - ci, high: score + ci };
}

const feed = "https://dubesor.de/chess/chess-data.json";
const board: Leaderboard = {
  benchmark: 'dubesor-lichess-puzzle-rating',
  parts: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [
    `band${i}`,
    { name: i === 0 ? 'Decile 1 (easiest)' : i === 9 ? 'Decile 10 (hardest)' : `Decile ${i + 1}`, group: 'Puzzle rating', unit: '%' },
  ])),
  url: "https://dubesor.de/chess/chess-leaderboard#puzzle-card",
  feed,
  terms: "The site allows this data path and restricts query URLs in robots.txt. The maker marks the game interface code as MIT. The leaderboard gives no separate license for its scores. https://dubesor.de/chess/",
  aliases: { 'gemma-2-27b-it': 'gemma-2-27b', 'mistral-large-3-2512': 'mistral-large-3',
    'nemotron-3-ultra-550b-a55b': 'nemotron-3-ultra' },
  stats: { puzzles: { name: 'Puzzles', unit: 'count' }, firstTry: { name: 'Solved on first try', unit: '%', better: 'higher' }, failed: { name: 'Failed puzzles', unit: '%', better: 'lower' }, partial: { name: 'Partially solved puzzles', unit: '%', better: 'higher' }, legal: { name: 'Legal move rate', unit: '%', better: 'higher' }, recovered: { name: 'Recovered puzzles', unit: '%', better: 'higher' }, secondsPerCall: { name: 'Seconds per call', unit: 'seconds', better: 'lower' }, tokensPerCall: { name: 'Tokens per call', unit: 'tokens', better: 'lower' } },
  async fetch() {
    const { puzzles: p } = await fetchJson<{puzzles: Puzzles}>(feed);
    const required = ['puzzle_id','player','suite','outcome','cost','completion_tokens','time_ms','api_calls','plies_correct','plies_total','illegal','strikes','date'];
    if (required.some(k => !p.fields.includes(k))) throw new Error('Missing puzzle attempt columns');
    const byModel = new Map<string, Attempt[]>(), opponents = new Map<string, number>();
    for (const row of p.rows) {
      const [id, player, suite, outcome, cost, tokens, ms, calls, correct, total, illegal, strikes, date] = required.map(k => row[p.fields.indexOf(k)]);
      if (p.dicts.suite[Number(suite)] !== 'v1') continue;
      const model = p.dicts.player[Number(player)], rating = p.puzzles[String(id)]?.[0];
      if (!model || !Number.isFinite(rating) || ![0,1,2].includes(Number(outcome))) throw new Error('Invalid puzzle attempt');
      opponents.set(String(id), rating);
      const attempts = byModel.get(model) ?? [];
      attempts.push({ id: String(id), rating, outcome: Number(outcome), cost: cost == null ? null : Number(cost),
        tokens: tokens == null ? null : Number(tokens), ms: ms == null ? null : Number(ms), calls: Number(calls), correct: Number(correct),
        total: Number(total), illegal: Number(illegal), strikes: Number(strikes), date: p.dicts.date[Number(date)] });
      byModel.set(model, attempts);
    }
    const sorted = [...opponents].sort((a,b) => a[1]-b[1] || a[0].localeCompare(b[0]));
    const bands = new Map<string,number>();
    const ranges: number[][] = [];
    let band = 0;
    sorted.forEach(([id,r], i) => {
      if (Math.floor(10*i/sorted.length) > band && r !== sorted[i-1]?.[1]) band++;
      bands.set(id,band);
      (ranges[band] ??= []).push(r);
    });
    const rows: LeaderboardRow[] = [];
    for (const [model, a] of byModel) {
      if (a.length < 100) continue;
      const sum = (fn: (x: Attempt) => number) => a.reduce((s,x) => s+fn(x), 0);
      const first = sum(x => +(x.outcome === 1)), second = sum(x => +(x.outcome === 2));
      const metrics: Record<string, number> = { puzzles: a.length, firstTry: pct(first,a.length),
        failed: pct(a.length-first-second,a.length), partial: pct(sum(x=>x.correct),sum(x=>x.total)),
        legal: pct(sum(x=>x.correct+x.strikes-x.illegal),sum(x=>x.correct+x.strikes)) };
      if (a.length > first) metrics.recovered = pct(second,a.length-first);
      const timedCalls = sum(x=>x.ms == null ? 0 : x.calls), tokenCalls = sum(x=>x.tokens == null ? 0 : x.calls);
      if (timedCalls) metrics.secondsPerCall = sum(x=>x.ms ?? 0)/timedCalls/1000;
      if (tokenCalls) metrics.tokensPerCall = Math.round(sum(x=>x.tokens ?? 0)/tokenCalls);
      for (const [i] of ranges.entries()) {
        const subset = a.filter(x=>bands.get(x.id) === i);
        if (subset.length) metrics['band'+i] = pct(subset.filter(x=>x.outcome === 1).length, subset.length);
      }
      const paid = a.filter(x=>(x.cost ?? 0)>0), ratings = a.map(x=>x.rating);
      const cost = paid.length ? sum(x=>x.cost ?? 0)/paid.length : undefined;
      for (const [setting, limit] of [['Classical', Infinity], ['Rapid', 16000], ['Blitz', 4000], ['Bullet', 1000]] as const) {
        const solved = sum(x => +(x.outcome === 1 && (x.tokens == null || x.tokens / Math.max(x.calls,1) <= limit)));
        if (limit !== Infinity && solved < 5) continue;
        rows.push({ model, setting, ...performance(ratings,solved), metrics, cost });
      }
    }
    if (rows.filter(r=>r.setting === 'Classical').length < 69) throw new Error('Missing rated chess models');
    return rows;
  },
};
export default board;
