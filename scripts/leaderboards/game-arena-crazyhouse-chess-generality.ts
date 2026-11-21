// Game Arena Crazyhouse Chess (Generality) ranks configurations by the published +/- Wins column.
// The variant JSON also gives Elo ratings, illegal move rates and game counts.
import type { Leaderboard } from './types.ts';
import { gameRows, gameAliases, gameStats } from './game-arena-atomic-chess-generality.ts';

const feed = "https://game-arena.ai/data/leaderboard/chess-crazyhouse.json";
const board: Leaderboard = {
  benchmark: 'game-arena-crazyhouse-chess-generality',
  url: "https://game-arena.ai/leaderboard/chess-crazyhouse",
  feed,
  terms: "The site serves HTML at robots.txt. The standings carry no stated score reuse license. https://game-arena.ai/leaderboard/chess-crazyhouse",
  stats: gameStats,
  aliases: { ...gameAliases, 'accounts/fireworks/models/qwen3-235b-a22b-thinking-2507': 'qwen3-235b-a22b-thinking-jul-2025',
    'accounts/fireworks/models/kimi-k2-instruct-0905': 'kimi-k2-sep-2025', 'deepseek-ai/deepseek-v3.1-maas': 'deepseek-v3-1',
    'deepseek-ai/deepseek-r1-0528-maas': 'deepseek-r1-may-2025', 'accounts/fireworks/models/llama-v3p3-70b-instruct': 'llama-3-3-70b' },
  async fetch() {
    return gameRows(feed, 'chess-crazyhouse', 15);
  },
};
export default board;
