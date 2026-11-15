// Quick View averages across the four source datasets. Higher accuracy is better.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/alibaba-damo-academy/ClinHallu/HEAD/README.md";
const board: Leaderboard = {
  benchmark: "clinhallu",
  url: "https://github.com/alibaba-damo-academy/ClinHallu",
  feed: FEED,
  terms: "Apache-2.0 repository; raw.githubusercontent.com has no robots.txt.",
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0]?.includes("Avg Acc\u2191"));
    if (!table) throw new Error('Published overall results table is missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[1]);
      if (score === undefined || !cells[0]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[2, "visualHallucination"], [3, "knowledgeHallucination"], [4, "reasoningHallucination"]] as const) {
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
