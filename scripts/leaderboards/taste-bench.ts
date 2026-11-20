// paired_order_v1, August 2026. Average weights engineering and research equally.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/wbopan/tastebench/HEAD/README.md";
const board: Leaderboard = {
  benchmark: "taste-bench",
  parts: {
    detourEngineering: { name: 'Detour engineering', group: 'Category' },
    detourResearch: { name: 'Detour research', group: 'Category' },
    parallelEngineering: { name: 'Parallel engineering', group: 'Category' },
    parallelResearch: { name: 'Parallel research', group: 'Category' },
  },
  url: "https://github.com/wbopan/tastebench#leaderboard",
  feed: FEED,
  terms: "MIT code and CC BY 4.0 data; public README results are not gated; raw.githubusercontent.com has no robots.txt.",
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0]?.includes("Average"));
    if (!table) throw new Error('Published overall results table is missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[1]);
      if (score === undefined || !cells[0]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[2, "detourEngineering"], [3, "detourResearch"], [4, "parallelEngineering"], [5, "parallelResearch"], [6, "unparsed"]] as const) {
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
