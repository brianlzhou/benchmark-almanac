// VSAS-Bench tests assistants answering questions about a live video stream.
// Table 2 reports overall accuracy and consistency for synchronous and asynchronous evaluation.
import type { Leaderboard, LeaderboardRow } from "./types.ts";
import { checked, grid, paperTables } from "../lib/boards/arxiv-span-tables.ts";
import { paperHtml } from "../lib/boards/arxiv-throttled.ts";

const feed = "https://arxiv.org/html/2604.07634";
const board: Leaderboard = {
  benchmark: "vsas-bench",
  url: feed, feed, static: "paper",
  terms: "The authors publish the paper under the terms linked at https://arxiv.org/abs/2604.07634",
  aliases: { "Qwen3-VL-2B": "qwen3-vl-2b-instruct", "Qwen3-VL-8B": "qwen3-vl-8b-instruct" },
  parts: { present: 'Present', cumulative: 'Cumulative', future: 'Future' },
  stats: { consistency: { name: 'Consistency', unit: '%', better: 'higher' } },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const t = tables.find(t => t[0][1]?.startsWith('Sync. Accuracy') && t[0][6]?.startsWith('Async. Accuracy'));
    if (!t || t[1][4] !== 'Overall' || t[1][9] !== 'Overall') throw new Error('Missing Table 2 overall accuracy');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      if (r[0] === r[1]) continue;
      const label = r[0].replace(/\s*\[\s*\d+\s*\]/,'');
      const match = label.match(/^(.+?) \((low|medium|high)\)$/);
      for (const [protocol,start] of [['Synchronous',1],['Asynchronous',6]] as const) {
        const [present,cumulative,future,score,consistency] = r.slice(start,start+5).map(Number);
        if (![present,cumulative,future,score,consistency].every(Number.isFinite)) throw new Error('Invalid streaming score');
        rows.push({ model: match?.[1] ?? label, setting: match ? protocol + ', ' + match[2] + ' effort' : protocol,
          score, metrics: { present,cumulative,future,consistency } });
      }
    }
    return checked(rows,28);
  },
};
export default board;
