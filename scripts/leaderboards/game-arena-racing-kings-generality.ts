// Generality ranks Racing Kings configurations by +/- Wins. Read the standings JSON for Elo, games played and reasoning settings.
import type { Leaderboard } from './types.ts';
import { gameRows, gameAliases, gameStats } from './game-arena-atomic-chess-generality.ts';

const FEED = "https://game-arena.ai/data/leaderboard/chess-racingkings.json";
const board: Leaderboard = {
  benchmark: "game-arena-racing-kings-generality",
  url: "https://game-arena.ai/leaderboard/chess-racingkings",
  feed: FEED,
  terms: "The standings list no score reuse license. https://game-arena.ai/leaderboard/chess-racingkings The robots URL returns HTML.",
  aliases: { ...gameAliases, 'deepseek-ai/deepseek-v3.1-maas': 'deepseek-v3-1', 'deepseek-ai/deepseek-r1-0528-maas': 'deepseek-r1-may-2025',
    'accounts/fireworks/models/qwen3-235b-a22b-thinking-2507': 'qwen3-235b-a22b-thinking-jul-2025',
    'accounts/fireworks/models/kimi-k2-instruct-0905': 'kimi-k2-sep-2025' },
  stats: gameStats,
  async fetch() {
    return gameRows(FEED, 'chess-racingkings', 15);
  },
};
export default board;
