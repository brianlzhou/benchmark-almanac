// Overall mean across four dimensions, source scale 1 to 5, Fail = 1 policy.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/kxding/PlayWorld/HEAD/README.md";
const board: Leaderboard = {
  benchmark: "playworld",
  parts: {
    geometry: { name: 'Geometry', group: 'Dimension' },
    interaction: { name: 'Interaction', group: 'Dimension' },
    insightEvolution: { name: 'In sight evolution', group: 'Dimension' },
    outOfSightEvolution: { name: 'Out of sight evolution', group: 'Dimension' },
  },
  url: "https://github.com/kxding/PlayWorld",
  feed: FEED,
  terms: "Public maker results table, no restriction on reading stated; image assets retain separate rights; raw.githubusercontent.com has no robots.txt.",
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0]?.includes("Overall"));
    if (!table) throw new Error('Published overall results table is missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[5]);
      if (score === undefined || !cells[0]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[1, "geometry"], [2, "interaction"], [3, "insightEvolution"], [4, "outOfSightEvolution"]] as const) {
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
