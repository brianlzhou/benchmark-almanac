// The LLM Public Goods Game measures the percentage of an endowment that each
// model contributes across repeated games. This importer reads the published
// Markdown table and keeps its standard error and game count.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://github.com/lechmazur/goods';
const FEED = 'https://raw.githubusercontent.com/lechmazur/goods/HEAD/README.md';

const board: Leaderboard = {
  benchmark: 'public-goods-game-lech-mazur', url: PAGE, feed: FEED,
  terms: 'The author publishes the results in the repository README. Separate score reuse terms are not stated.',
  async fetch() {
    const markdown = await fetchText(FEED);
    const rows: LeaderboardRow[] = [];
    for (const line of markdown.split('\n')) {
      const match = line.match(/^\|\s*\d+\s*\|\s*([^|]+?)\s*\|\s*([\d.]+)%\s*\|\s*±([\d.]+)\s*\|\s*(\d+)\s*\|/);
      if (!match) continue;
      const score = Number(match[2]); const error = Number(match[3]);
      rows.push({ model: match[1].trim(), score, trials: Number(match[4]), metrics: { stderr: error } });
    }
    if (rows.length < 15) throw new Error(`LLM Public Goods Game: ${rows.length} rows, expected at least 15`);
    return rows;
  },
};
export default board;
