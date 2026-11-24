// LVSum tests timestamped long-video summaries. Table 2 reports Kendall rank correlation first.
// Tables 3 and 5 provide single-modality results and category scores.
import type { Leaderboard, LeaderboardRow } from "./types.ts";
import { checked, grid, paperTables } from "../lib/boards/arxiv-span-tables.ts";
import { paperHtml } from "../lib/boards/arxiv-throttled.ts";

const feed = "https://arxiv.org/html/2604.10024";
const board: Leaderboard = {
  benchmark: "lvsum",
  url: feed, feed, static: "paper",
  terms: "The authors publish the paper under the terms linked at https://arxiv.org/abs/2604.10024",
  aliases: { 'Opus-4.5': 'claude-opus-4-5', 'Qwen3-VL-235B': 'qwen3-vl-235b-a22b-instruct' },
  parts: {}, stats: { rho: { name: 'Spearman correlation', unit: 'score' }, cr: { name: 'Content Relevance', unit: 'score' }, mc: { name: 'Modality Coherence', unit: 'score' }, length: { name: 'Approximate summary length', unit: '%' } },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0].join('|') === 'Model|Model Input|\\tau|\\rho|CR|MC|Sum. Len.');
    const inputs = tables.find(t => t[0].join('|') === 'Model|Input|\\tau|\\rho|Sum. Len.');
    const categories = tables.find(t => t[0].join('|') === 'Model|Category|\\tau|\\rho|CR|MC|Sum. Len.');
    if (!main || !inputs || !categories) throw new Error('Missing LVSum tables');
    const rows: LeaderboardRow[] = [];
    for (const [model, input, tau, rho, ...extra] of [...main.slice(1), ...inputs.slice(1).filter(r => r[1] !== 'V + T')]) {
      if (['Human','Random','Even'].includes(model)) continue;
      const setting = ({ 'V + T': 'Video and transcript', V: 'Video', T: 'Transcript' } as Record<string,string>)[input];
      const length = extra.at(-1)?.match(/(\d+)\\%/);
      if (!setting || !length) throw new Error('Invalid LVSum input or length');
      const metrics: Record<string,number> = { rho: Number(rho), length: Number(length[1]) };
      if (input === 'V + T') {
        metrics.cr = Number(extra[0]); metrics.mc = Number(extra[1]);
        for (const [,category,value] of categories.filter(r => r[0] === model)) {
          board.parts![category] = category;
          metrics[category] = Number(value);
        }
      }
      rows.push({ model, setting, score: Number(tau), metrics });
    }
    return checked(rows, 9);
  },
};
export default board;
