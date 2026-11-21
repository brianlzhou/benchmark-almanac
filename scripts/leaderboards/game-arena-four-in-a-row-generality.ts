// Generality ranks Four-in-a-Row configurations by +/- Wins. Read the standings JSON for Elo, games played and reasoning settings.
import type { Leaderboard } from './types.ts';
import { gameRows, gameAliases, gameStats } from './game-arena-atomic-chess-generality.ts';

const FEED = "https://game-arena.ai/data/leaderboard/four_in_a_row-standard.json";
const board: Leaderboard = {
  benchmark: "game-arena-four-in-a-row-generality",
  url: "https://game-arena.ai/leaderboard/four_in_a_row-standard",
  feed: FEED,
  terms: "The standings list no score reuse license. https://game-arena.ai/leaderboard/four_in_a_row-standard The robots URL returns HTML.",
  stats: gameStats,
  aliases: { ...gameAliases, 'openai/gpt-oss-120b-maas': 'gpt-oss-120b', 'claude-sonnet-4-5@20250929': 'claude-sonnet-4-5', 'deepseek-ai/deepseek-v3.1-maas': 'deepseek-v3-1', 'deepseek-ai/deepseek-r1-0528-maas': 'deepseek-r1-may-2025',
    'accounts/fireworks/models/qwen3-235b-a22b-thinking-2507': 'qwen3-235b-a22b-thinking-jul-2025',
    'accounts/fireworks/models/kimi-k2-instruct-0905': 'kimi-k2-sep-2025' },
  async fetch() {
    const rows = [];
    for (const [variant, label] of [['four_in_a_row-standard', 'ASCII board'], ['four_in_a_row-fen', 'FEN board']]) {
      if (rows.length) await new Promise(resolve => setTimeout(resolve, 1000));
      const entries = await gameRows(FEED.replace('four_in_a_row-standard', variant), variant, 27);
      rows.push(...entries.map(r => ({ ...r, setting: [label, r.setting].filter(Boolean).join(', ') })));
    }
    return rows;
  },
};
export default board;
