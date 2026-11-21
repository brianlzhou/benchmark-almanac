// Crest Arcade FreeCell ranks models by average win rate across five tiers. The game API includes completed and provisional scores, confidence intervals and per-game usage.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import type { LeaderboardRow } from './types.ts';

const FEED = "https://glimmerindex.com/api/bench/freecell";

interface Contestant extends Record<string, unknown> {
  name: string; effort?: string; open_weights?: boolean; score: number | null; score_low?: number; score_high?: number;
  ranked?: boolean; tiers?: Record<string, Record<string, number | null>>;
}
interface Fields {
  minimum: number;
  count: string;
  cost: string;
  tokens: string;
  latency: string;
  date: string;
  tierMetric?: string;
  tierScale?: number;
  rankKey?: 'qualifiedRank' | 'standingsRank';
}
export async function crestGame(board: Leaderboard, fields: Fields): Promise<LeaderboardRow[]> {
  const data = await fetchJson<{ contestants: Contestant[]; tiers?: { key: string; name: string }[] }>(board.feed);
  const tokenKeys: Record<string, string> = {};
  if (fields.tokens) {
    tokenKeys[fields.tokens] = 'outputTokens';
    tokenKeys[fields.tokens.replace('tokens_out_', 'tokens_in_')] = 'inputTokens';
    tokenKeys[fields.tokens.replace('tokens_out_', 'tokens_reasoning_')] = 'reasoningTokens';
  }
  const rows: LeaderboardRow[] = [];
  const labels = new Map((data.tiers ?? []).map((t) => [t.key, t.name]));
  const parts: Record<string, string> = {};
  for (const p of data.contestants) {
    if (p.score === null) continue;
    if (!p.name || !Number.isFinite(p.score)) throw new Error('Missing arcade score or contestant');
    const number = (key: string) => typeof p[key] === 'number' ? p[key] as number : undefined;
    const metrics: Record<string, number> = {};
    for (const [key, value] of Object.entries(p)) {
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      if (key === 'rank') {
        if (fields.rankKey) metrics[fields.rankKey] = value;
      } else {
        metrics[tokenKeys[key] ?? key] = value;
      }
    }
    if (fields.tierMetric) {
      if (!p.tiers || !labels.size) throw new Error('Missing arcade tiers');
      for (const [key, tier] of Object.entries(p.tiers)) {
        const value = tier[fields.tierMetric];
        if (value == null) continue;
        if (!labels.has(key) || !Number.isFinite(value)) throw new Error(`Invalid tier ${key}`);
        parts[key] = labels.get(key)!;
        metrics[key] = value * (fields.tierScale ?? 1);
      }
    }
    const date = p[fields.date];
    rows.push({ model: p.name, setting: [p.effort, p.ranked === false || p.complete_set === false ? 'Provisional' : ''].filter(Boolean).join(' · ') || undefined,
      score: p.score, low: p.score_low ?? undefined, high: p.score_high ?? undefined, trials: number(fields.count),
      open: p.open_weights, cost: p.cost_known === false ? undefined : number(fields.cost), tokens: number(fields.tokens),
      date: typeof date === 'string' ? date.slice(0, 10) : undefined,
      metrics: { ...metrics, ...(number(fields.latency) != null ? { latency: number(fields.latency)! } : {}) } });
  }
  if (rows.length < fields.minimum) throw new Error(`Expected at least ${fields.minimum} arcade scores, found ${rows.length}`);
  board.parts = parts;
  return rows;
}

const board: Leaderboard = {
  benchmark: "crest-arcade-freecell",
  url: "https://glimmerindex.com/bench#freecell",
  feed: FEED,
  terms: "Glimmer Index permits use with credit. https://glimmerindex.com/bench#freecell-method Glimmer Index allows all paths in robots.txt.",
  async fetch() {
    return crestGame(board, { rankKey: 'qualifiedRank', minimum: 18, count: 'games', cost: 'cost_per_game', tokens: 'tokens_out_per_game',
      latency: 'seconds_per_game', date: 'last_game', tierMetric: 'rate', tierScale: 100 });
  },
};
export default board;
