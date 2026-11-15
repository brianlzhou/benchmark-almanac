// Published All score, all tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const URL = "https://alibaba-damo-academy.github.io/WorldOlympiad";
const board: Leaderboard = {
  benchmark: "worldolympiad", url: URL, feed: URL,
  terms: "The project site states MIT licensing; no robots.txt on the maker site.",
  async fetch() {
    const table = tables(await fetchText(URL)).map(t => t.map(r => r.map(c => c.text))).find(t => t[0]?.some(c => c.includes("Physical")));
    if (!table) throw new Error('Overall table missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[7]);
      if (score === undefined || !cells[1]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[3, "physical"], [4, "consistency3d"], [5, "clip"], [6, "interaction"]] as [number, string][]) {
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
