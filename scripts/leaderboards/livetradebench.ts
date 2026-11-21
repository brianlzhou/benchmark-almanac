// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Table 2 compares cumulative return across the U.S. stock market and Polymarket over the same trading period.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2511.03628";
const board: Leaderboard = {
  benchmark: "livetradebench", url: "https://arxiv.org/html/2511.03628", feed,
  terms: "The authors publish these results under the terms of the source. https://arxiv.org/abs/2511.03628",
  aliases: {"Claude-Sonnet-3.7":"claude-3-7-sonnet","GPT-o3":"o3","Qwen3-235B-A22B-Instruct":"qwen3-235b-a22b-instruct-jul-2025","Qwen3-235B-A22B-Thinking":"qwen3-235b-a22b-thinking-jul-2025","Qwen2.5-72B-Instruct":"qwen2-5-72b","Llama3.3-70B-Instruct-Turbo":"llama-3-3-70b-instruct"},
  parts: {"stock":"U.S. Stock Market","polymarket":"Polymarket Prediction Market"},
  async fetch() {
    const matrices = paperTables(await paperHtml(feed)).map(grid);
    const table = matrices.find(rows => rows[1]?.join('|') === "|CR\\uparrow|SR\\uparrow|MDD\\downarrow|WR\\uparrow|\\sigma\\downarrow|CR\\uparrow|SR\\uparrow|MDD\\downarrow|WR\\uparrow|\\sigma\\downarrow");
    if (!table) throw new Error('Reviewed results table missing');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(2)) {
      const model = cells[0];
      const number = (index: number) => {
        const value = cells[index]?.trim();
        if (!/^-?\d+(?:\.\d+)?%?$/.test(value)) throw new Error('Invalid score for ' + model);
        return parseFloat(value);
      };
      const metrics = { "stock": number(1), "stockSharpe": number(2), "stockMaxDrawdown": number(3), "stockWinRate": number(4), "stockVolatility": number(5), "polymarket": number(6), "polymarketSharpe": number(7), "polymarketMaxDrawdown": number(8), "polymarketWinRate": number(9), "polymarketVolatility": number(10) };
      rows.push({ model, score: (metrics["stock"] + metrics["polymarket"]) / 2, metrics });
    }
    return checked(rows, 21);
  },
};
export default board;
