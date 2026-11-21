// Game Arena ranks Atomic Chess configurations by its published +/- Wins column.
// The variant feed also reports Elo, games played and error rate.
import type { BoardStat, Leaderboard} from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface GameEntry {
  game_variant: string; model_name: string; win_diff: number; elo_rating: number; games_played: number; error_rate: number;
  reasoning_effort: string; config: { checkpoint: string; reasoning_effort?: string; thinking?: string; thinking_budget?: number };
}
export async function gameRows(feed: string, variant: string, minimum: number) {
  const data = await fetchJson<GameEntry[]>(feed);
  if (data.length < minimum) throw new Error('Missing Game Arena configurations for ' + variant);
  return data.map(r => {
    if (r.game_variant !== variant || !r.model_name || !r.config.checkpoint ||
      ![r.win_diff, r.elo_rating, r.games_played, r.error_rate].every(Number.isFinite)) throw new Error('Invalid Game Arena result');
    const effort = r.config.reasoning_effort || r.reasoning_effort;
    const setting = [effort && 'reasoning ' + effort, r.config.thinking && 'thinking ' + r.config.thinking,
      r.config.thinking_budget && 'thinking budget ' + r.config.thinking_budget].filter(Boolean).join(', ') || undefined;
    return { model: r.config.checkpoint, setting, score: r.win_diff, trials: r.games_played, metrics: { elo: r.elo_rating, errorRate: r.error_rate * 100 } };
  });
}
export const gameAliases = {
  'accounts/fireworks/models/deepseek-r1-0528': 'deepseek-r1-may-2025',
  'accounts/fireworks/models/deepseek-v3p1': 'deepseek-v3-1', 'accounts/fireworks/models/glm-4p5': 'glm-4-5',
  'accounts/fireworks/models/llama-v3p3-70b-instruct': 'llama-3-3-70b-instruct',
  'claude-opus-4-1@20250805': 'claude-opus-4-1', 'claude-sonnet-4@20250514': 'claude-sonnet-4',
};
export const gameStats: Record<string, BoardStat> = { elo: { name: 'Elo', unit: 'elo', better: 'higher' }, errorRate: { name: 'Error rate', unit: '%', better: 'lower' } };

const FEED = "https://game-arena.ai/data/leaderboard/chess-atomic.json";
const board: Leaderboard = {
  benchmark: "game-arena-atomic-chess-generality",
  url: "https://game-arena.ai/leaderboard/chess-atomic",
  feed: FEED,
  terms: "The standings list no score reuse license. https://game-arena.ai/leaderboard/chess-atomic The robots URL returns HTML.",
  aliases: gameAliases,
  stats: gameStats,
  async fetch() {
    return gameRows(FEED, 'chess-atomic', 15);
  },
};
export default board;
