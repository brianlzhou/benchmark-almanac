// Overall Elo, with win rate as a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/agentset-ai/reranker-eval/HEAD/README.md";
const board: Leaderboard = {
  benchmark: "agentset-reranker-eval",
  url: "https://github.com/agentset-ai/reranker-eval",
  feed: FEED,
  terms: "Public maker README, no additional use restriction stated; raw.githubusercontent.com has no robots.txt.",
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0]?.includes("ELO"));
    if (!table) throw new Error('Published overall results table is missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[2]);
      if (score === undefined || !cells[1]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[3, "winRate"]] as const) {
        const value = num(cells[column]);
        if (value !== undefined) metrics[key] = value;
      }
      out.push({ model: cells[1], score, metrics });
    }
    if (out.length < 3) throw new Error(`Only ${out.length} model rows`);
    return out;
  },
};
export default board;
