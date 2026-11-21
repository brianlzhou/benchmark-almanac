// Overall Pass@3 on the published repository task version, not the revised paper.
// The README reports pass@1 alongside the pass@3 headline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/Emanual20/adbench-leaderboard/HEAD/README.md";
const board: Leaderboard = {
  benchmark: "ad-bench",
  url: "https://github.com/Emanual20/adbench-leaderboard",
  feed: FEED,
  terms: "Public maker README, no additional use restriction stated; raw.githubusercontent.com has no robots.txt.",
  stats: { passAt1: { name: 'Pass@1', unit: '%', better: 'higher' } },
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0]?.includes("Pass@1"));
    if (!table) throw new Error('Published overall results table is missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[4]);
      if (score === undefined || !cells[1]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[3, "passAt1"]] as const) {
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
