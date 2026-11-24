// RealityTest asks conversational models to disclose their AI identity.
// Table 20 estimates disclosure probability with a mixed-effects model for each input modality.
import type { Leaderboard, LeaderboardRow } from "./types.ts";
import { checked, grid, paperTables } from "../lib/boards/arxiv-span-tables.ts";
import { paperHtml } from "../lib/boards/arxiv-throttled.ts";

const feed = "https://arxiv.org/html/2606.00168";
const board: Leaderboard = {
  benchmark: "realitytest-aisi",
  url: feed, feed, static: "paper",
  terms: "The authors publish the paper under the terms linked at https://arxiv.org/abs/2606.00168",
  headline: 'The score is the paper’s estimated probability of disclosure for each modality, expressed as a percentage.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const t = tables.find(t => t[0].join('|') === 'Model|Sp.|Tx.|Model|Sp.|Tx.');
    if (!t) throw new Error('Missing Table 20 disclosure probabilities');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      for (const i of [0,3]) {
        if (!r[i]) continue;
        for (const offset of [1,2]) {
          const value = r[i+offset];
          if (value === '—') continue;
          if (!/^0?\.\d+$/.test(value)) throw new Error('Invalid disclosure probability');
          rows.push({ model: r[i], setting: offset === 1 ? 'Speech' : 'Text', score: Number((Number(value)*100).toFixed(3)) });
        }
      }
    }
    return checked(rows, 23);
  },
};
export default board;
