// Game Arena King of the Hill (Generality) ranks configurations by the published +/- Wins column.
// The variant JSON also gives Elo ratings, illegal move rates and game counts.
import type { Leaderboard } from './types.ts';
import { gameRows, gameAliases, gameStats } from './game-arena-atomic-chess-generality.ts';

const feed = "https://game-arena.ai/data/leaderboard/chess-kingofthehill.json";
const board: Leaderboard = {
  benchmark: 'game-arena-king-of-the-hill-generality',
  url: "https://game-arena.ai/leaderboard/chess-kingofthehill",
  feed,
  terms: "The site serves HTML at robots.txt. The maker lists no score reuse license on this page. https://game-arena.ai/leaderboard/chess-kingofthehill",
  aliases: { ...gameAliases, 'accounts/fireworks/models/qwen3-235b-a22b-thinking-2507': 'qwen3-235b-a22b-thinking-jul-2025',
    'accounts/fireworks/models/kimi-k2-instruct-0905': 'kimi-k2-sep-2025', 'deepseek-ai/deepseek-v3.1-maas': 'deepseek-v3-1',
    'deepseek-ai/deepseek-r1-0528-maas': 'deepseek-r1-may-2025', 'accounts/fireworks/models/llama-v3p3-70b-instruct': 'llama-3-3-70b' },
  stats: gameStats,
  async fetch() {
    return gameRows(feed, 'chess-kingofthehill', 15);
  },
};
export default board;
