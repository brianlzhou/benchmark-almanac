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
export function crestStats(fields: Fields): NonNullable<Leaderboard['stats']> {
  const stats: NonNullable<Leaderboard['stats']> = {
    won: { name: 'Games won', unit: 'count' }, lost: { name: 'Games lost', unit: 'count' }, aborted: { name: 'Aborted games', unit: 'count' }, draws: { name: 'Draws', unit: 'count' }, round_rate: { name: 'Round win rate', unit: 'score', better: 'higher' }, counter_rate: { name: 'Counter rate', unit: 'score', better: 'higher' }, countered_rate: { name: 'Countered rate', unit: 'score', better: 'lower' }, illegal_rate: { name: 'Illegal action rate', unit: 'score', better: 'lower' }, unreadable_rate: { name: 'Unreadable response rate', unit: 'score', better: 'lower' }, default_rate: { name: 'Default response rate', unit: 'score', better: 'lower' }, truncated_rate: { name: 'Truncated response rate', unit: 'score', better: 'lower' }, retries: { name: 'Retries', unit: 'count', better: 'lower' }, requests: { name: 'Requests', unit: 'count' }, cost_total: { name: 'Total cost', unit: 'usd', better: 'lower' },
  };
  const noun = fields.count === 'matches' ? 'match' : fields.count === 'games' ? 'game' : 'run';
  stats[fields.count] = { name: `${noun[0].toUpperCase()}${noun.slice(1)} played`, unit: 'count' };
  stats.decisions = { name: 'Decisions', unit: 'count' };
  stats[`decisions_per_${noun}`] = { name: `Decisions per ${noun}`, unit: 'count', better: 'lower' };
  stats.requests_per_match = { name: 'Requests per match', unit: 'count', better: 'lower' };
  stats.requests_per_game = { name: 'Requests per game', unit: 'count', better: 'lower' };
  stats.tokens_in_per_decision = { name: 'Input tokens per decision', unit: 'tokens', better: 'lower' };
  stats.tokens_out_per_decision = { name: 'Output tokens per decision', unit: 'tokens', better: 'lower' };
  stats.tokens_reasoning_per_decision = { name: 'Reasoning tokens per decision', unit: 'tokens', better: 'lower' };
  stats.seconds_per_decision = { name: 'Seconds per decision', unit: 'seconds', better: 'lower' };
  stats[`seconds_per_${noun}`] = { name: `Seconds per ${noun}`, unit: 'seconds', better: 'lower' };
  if (fields.count === 'matches') {
    Object.assign(stats, { rounds_won: { name: 'Rounds won', unit: 'count' }, rounds_lost: { name: 'Rounds lost', unit: 'count' }, card_rating: { name: 'Card rating', unit: 'rating', better: 'higher' } });
  } else if (fields.count === 'games') {
    delete stats.won;
    Object.assign(stats, { cards_home: { name: 'Cards home', unit: 'count' }, refused_per_game: { name: 'Refused moves per game', unit: 'count', better: 'lower' }, refused_rate: { name: 'Refusal rate', unit: 'score', better: 'lower' }, unreadable_moves: { name: 'Unreadable moves', unit: 'count', better: 'lower' }, moves_per_game: { name: 'Moves per game', unit: 'count', better: 'lower' }, turns_per_game: { name: 'Turns per game', unit: 'count', better: 'lower' }, moves_per_reply: { name: 'Moves per reply', unit: 'count', better: 'lower' }, moves_per_win: { name: 'Moves per win', unit: 'count', better: 'lower' }, inputTokens: { name: 'Input tokens', unit: 'tokens', better: 'lower' }, reasoningTokens: { name: 'Reasoning tokens', unit: 'tokens', better: 'lower' }, cost_per_solve: { name: 'Cost per solve', unit: 'usd', better: 'lower' }, solved: { name: 'Solved games', unit: 'count' }, solve_rate: { name: 'Solve rate', unit: 'score', better: 'higher' } });
  } else if (fields.count === 'runs') {
    Object.assign(stats, { finish_rate: { name: 'Finish rate', unit: 'score', better: 'higher' }, beat_bot: { name: 'Runs beating the bot', unit: 'count' }, progress: { name: 'Progress', unit: 'score', better: 'higher' }, replies: { name: 'Replies', unit: 'count' }, replies_per_run: { name: 'Replies per run', unit: 'count', better: 'lower' }, segments_per_reply: { name: 'Segments per reply', unit: 'count', better: 'lower' }, clamped: { name: 'Clamped replies', unit: 'count', better: 'lower' }, trimmed: { name: 'Trimmed replies', unit: 'count', better: 'lower' }, refused: { name: 'Refused replies', unit: 'count', better: 'lower' }, unreadable: { name: 'Unreadable replies', unit: 'count', better: 'lower' }, unreadable_rate: { name: 'Unreadable response rate', unit: 'score', better: 'lower' }, requests_per_run: { name: 'Requests per run', unit: 'count', better: 'lower' }, tokens_in_per_reply: { name: 'Input tokens per reply', unit: 'tokens', better: 'lower' }, tokens_out_per_reply: { name: 'Output tokens per reply', unit: 'tokens', better: 'lower' }, tokens_reasoning_per_reply: { name: 'Reasoning tokens per reply', unit: 'tokens', better: 'lower' }, seconds_per_reply: { name: 'Seconds per reply', unit: 'seconds', better: 'lower' }, model_minutes_per_run: { name: 'Model minutes per run', unit: 'minutes', better: 'lower' } });
  }
  const keys = fields.count === 'matches'
    ? ['matches', 'aborted', 'won', 'lost', 'rounds_won', 'rounds_lost', 'round_rate', 'draws', 'counter_rate', 'countered_rate', 'card_rating', 'decisions', 'decisions_per_match', 'illegal_rate', 'unreadable_rate', 'default_rate', 'retries', 'truncated_rate', 'requests', 'requests_per_match', 'tokens_in_per_decision', 'tokens_out_per_decision', 'tokens_reasoning_per_decision', 'seconds_per_decision', 'seconds_per_match', 'cost_total']
    : fields.count === 'games'
      ? ['games', 'aborted', 'solved', 'solve_rate', 'cards_home', 'refused_per_game', 'refused_rate', 'unreadable_moves', 'moves_per_game', 'turns_per_game', 'moves_per_reply', 'retries', 'truncated_rate', 'requests_per_game', 'inputTokens', 'reasoningTokens', 'seconds_per_game', 'moves_per_win', 'cost_total', 'cost_per_solve']
      : Object.keys(stats);
  return Object.fromEntries(keys.filter((key) => stats[key]).map((key) => [key, stats[key]]));
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
  for (const p of data.contestants) {
    if (p.score === null) continue;
    if (!p.name || !Number.isFinite(p.score)) throw new Error('Missing arcade score or contestant');
    const number = (key: string) => typeof p[key] === 'number' ? p[key] as number : undefined;
    const metrics: Record<string, number> = {};
    for (const [key, value] of Object.entries(p)) {
      if (typeof value !== 'number' || !Number.isFinite(value) || key === 'rank') continue;
      const mapped = tokenKeys[key] ?? key;
      if ((board.stats && mapped in board.stats) || /_(?:low|high)$/.test(mapped)) metrics[mapped] = value;
    }
    if (fields.tierMetric) {
      if (!p.tiers || !labels.size) throw new Error('Missing arcade tiers');
      for (const [key, tier] of Object.entries(p.tiers)) {
        const value = tier[fields.tierMetric];
        if (value == null) continue;
        if (!labels.has(key) || !Number.isFinite(value)) throw new Error(`Invalid tier ${key}`);
        metrics[key] = value * (fields.tierScale ?? 1);
      }
    }
    const date = p[fields.date];
    rows.push({ model: p.name, setting: [p.effort, p.ranked === false || p.complete_set === false ? 'Provisional' : ''].filter(Boolean).join(', ') || undefined,
      score: p.score, low: p.score_low ?? undefined, high: p.score_high ?? undefined, trials: number(fields.count),
      open: p.open_weights, cost: p.cost_known === false ? undefined : number(fields.cost), tokens: number(fields.tokens),
      date: typeof date === 'string' ? date.slice(0, 10) : undefined,
      metrics });
  }
  if (rows.length < fields.minimum) throw new Error(`Expected at least ${fields.minimum} arcade scores, found ${rows.length}`);
  return rows;
}

const board: Leaderboard = {
  benchmark: "crest-arcade-freecell",
  url: "https://glimmerindex.com/bench#freecell",
  feed: FEED,
  terms: "Glimmer Index permits use with credit. https://glimmerindex.com/bench#freecell-method Glimmer Index allows all paths in robots.txt.",
  parts: { easy: 'Easy', four: 'Four cells', three: 'Three cells', two: 'Two cells', beyond: 'Beyond' },
  stats: crestStats({ minimum: 18, count: 'games', cost: 'cost_per_game', tokens: 'tokens_out_per_game', latency: 'seconds_per_game', date: 'last_game' }),
  async fetch() {
    return crestGame(board, { minimum: 18, count: 'games', cost: 'cost_per_game', tokens: 'tokens_out_per_game',
      latency: 'seconds_per_game', date: 'last_game', tierMetric: 'rate', tierScale: 100 });
  },
};
export default board;
