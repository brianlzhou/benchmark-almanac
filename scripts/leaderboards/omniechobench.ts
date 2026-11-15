// Published Overall on the 2972-question reasoning benchmark; navigation is separate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/PKU-VaLuE-Lab/OmniEcho/HEAD/README.md";
const board: Leaderboard = {
  benchmark: "omniechobench",
  url: "https://pku-value-lab.github.io/OmniEcho/leaderboard/",
  feed: FEED,
  terms: "Public maker README results; no additional reading restriction stated; raw.githubusercontent.com has no robots.txt.",
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0]?.includes("Overall"));
    if (!table) throw new Error('Published overall results table is missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[6]);
      if (score === undefined || !cells[0]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[1, "cameraRotation"], [2, "sourceDirection"], [3, "localization3d"], [4, "sourceMotion"], [5, "cognitiveMap"]] as const) {
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
