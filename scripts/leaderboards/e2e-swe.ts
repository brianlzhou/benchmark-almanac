// E2E-SWE tests whether agents can build working repositories from specifications.
// Table 2 reports the percentage of 186 projects fully resolved, averaged over four runs.
import type { Leaderboard, LeaderboardRow } from "./types.ts";
import { checked, grid, paperTables } from "../lib/boards/arxiv-span-tables.ts";
import { paperHtml } from "../lib/boards/arxiv-throttled.ts";

const feed = "https://arxiv.org/html/2609.38335";
const board: Leaderboard = {
  benchmark: "e2e-swe",
  url: feed, feed, static: "paper",
  terms: "The authors publish the paper under the terms linked at https://arxiv.org/abs/2609.38335",
  reference: ['ReAct'],
  stats: { steps: { name: 'Agent turns', unit: 'count' }, outputTokens: { name: 'Output tokens', unit: 'tokens' } },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0].join('|') === 'Model|Effort|Pass@1|Agent turns|Output tokens (k)');
    if (!table) throw new Error('E2E-SWE Table 2 missing');
    return checked(table.slice(1).map(([label, setting, pass, turns, thousands]) => {
      const model = label.split(' (')[0].split(' \\dagger')[0];
      const outputTokens = Number(thousands) * 1000;
      if (!Number.isFinite(outputTokens) || !Number.isFinite(Number(turns))) throw new Error('Invalid resource measurement');
      return { model, setting, harness: 'ReAct', trials: 4, score: Number(pass), tokens: outputTokens, metrics: { steps: Number(turns), outputTokens } };
    }), 13);
  },
};
export default board;
