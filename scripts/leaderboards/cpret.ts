// Published average retrieval score. Fine-tuned retrievers retain their own names.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/coldchair/CPRet/HEAD/README.md";
const board: Leaderboard = {
  benchmark: "cpret",
  url: "https://github.com/coldchair/CPRet",
  feed: FEED,
  terms: "CC BY-NC 4.0 README results, attributed to the makers; raw.githubusercontent.com has no robots.txt.",
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0]?.includes("Avg"));
    if (!table) throw new Error('Published overall results table is missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[7]);
      if (score === undefined || !cells[0]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[3, "textToCode"], [4, "codeToCode"], [5, "problemToDuplicate"], [6, "simplifiedToFull"]] as const) {
        const value = num(cells[column]);
        if (value !== undefined) metrics[key] = value;
      }
      out.push({ model: cells[0], score, metrics });
    }
    if (out.length < 3) throw new Error(`Only ${out.length} model rows`);
    return out;
  },
};
export default board;
