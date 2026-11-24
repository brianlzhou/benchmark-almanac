// CiteBench tests whether generated answers cite their sources correctly.
// Table 4 gives CiteEval-Auto quality across the full test set, including uncited statements.
import type { Leaderboard, LeaderboardRow } from "./types.ts";
import { checked, grid, paperTables } from "../lib/boards/arxiv-span-tables.ts";
import { paperHtml } from "../lib/boards/arxiv-throttled.ts";

const feed = "https://arxiv.org/html/2506.01829";
const board: Leaderboard = {
  benchmark: "citebench",
  url: feed, feed, static: "paper",
  terms: "The authors publish the paper under the terms linked at https://arxiv.org/abs/2506.01829",
  aliases: { 'GPT-4-turbo (snapshot unspecified)': 'gpt-4-turbo-apr-2024', 'GPT-4o-mini (snapshot unspecified)': 'gpt-4o-mini' },
  stats: {
    cited: { name: 'Cited scenario quality', unit: 'score', better: 'higher' },
    length: { name: 'Statements per response', unit: 'count' },
    missing: { name: 'Statements without citations', unit: '%', better: 'lower' },
  },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0][1] === 'CiteEval-Auto' && t[1]?.join('|') === 'Models|Full|Cited||R||M');
    if (!table) throw new Error('Missing Table 4 citation quality columns');
    const rows: LeaderboardRow[] = [];
    for (const [name, full, cited, length, missing] of table.slice(2)) {
      if (!name || name === full) continue;
      const model = name.replace('\\times', 'x');
      if (![full, cited, length, missing].every(v => v && Number.isFinite(Number(v)))) throw new Error('Invalid citation quality row');
      rows.push({ model, score: Number(full), metrics: { cited: Number(cited), length: Number(length), missing: Number(missing)*100 } });
    }
    return checked(rows, 12);
  },
};
export default board;
