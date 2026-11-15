// Macro success over the five task types; NPP ladder is a separate metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const URL = "https://research.composite.com/composite-bench";
const board: Leaderboard = {
  benchmark: "composite-bench", url: URL, feed: URL,
  terms: "Public maker results, robots.txt allows all agents; no additional reading restrictions stated.",
  async fetch() {
    const table = tables(await fetchText(URL)).map(t => t.map(r => r.map(c => c.text))).find(t => t[0]?.some(c => c.includes("Macro success")));
    if (!table) throw new Error('Overall table missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[2]);
      if (score === undefined || !cells[1]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[4, "meanReward"], [5, "nppLadder"], [6, "runCost"]] as [number, string][]) {
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
