// RVMS-Bench tests video retrieval across nine memory-cue combinations.
// Table 1 gives rule-only retrieval recall across all nine. Model-assisted recall and localization cover fewer tasks.
import type { Leaderboard, LeaderboardRow } from "./types.ts";
import { checked, grid, paperTables } from "../lib/boards/arxiv-span-tables.ts";
import { paperHtml } from "../lib/boards/arxiv-throttled.ts";

const feed = "https://arxiv.org/html/2602.10159";
const board: Leaderboard = {
  benchmark: "rvms-bench",
  url: feed, feed, static: "paper",
  terms: "The authors publish the paper under the terms linked at https://arxiv.org/abs/2602.10159",
  parts: {}, stats: { modelRule: { name: 'Model + Rule recall', unit: '%' }, localization: { name: 'Moment Localization accuracy', unit: '%' } },
  aliases: { 'Claude-4.5-Sonnet': 'claude-sonnet-4-5', 'Qwen3-VL-235B': 'qwen3-vl-235b-a22b-instruct' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const t = tables.find(t => t[0][1] === 'Rule Only' && t[0][11] === 'Model + Rule');
    const loc = tables.find(t => t[0][1] === 'Moment Localization');
    if (!t || !loc || t[1][10] !== 'Avg' || t[1][20] !== 'Avg' || loc[1][10] !== 'Avg') throw new Error('Missing RVMS tables');
    const rows: LeaderboardRow[] = [];
    let open: boolean | undefined;
    for (const r of t.slice(2)) {
      if (r[0] === r[1]) {
        if (/Open Source/i.test(r[0])) open = true;
        else if (/Closed Source/i.test(r[0])) open = false;
        continue;
      }
      if (r[0] === 'Human') continue;
      const l = loc.find(row => row[0] === r[0]);
      if (!l) throw new Error('Missing localization scores');
      const metrics: Record<string,number> = { modelRule: Number(r[20]), localization: Number(l[10]) };
      for (let i = 1; i <= 9; i++) {
        for (const [group,value] of [['Rule Only',r[i]],['Model + Rule',r[10+i]],['Moment Localization',l[i]]]) {
          if (value === '-') continue;
          const key = group + ' ' + t[1][i];
          metrics[key] = Number(value);
          board.parts![key] = { name: t[1][i], group };
        }
      }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid retrieval result');
      rows.push({ model: r[0], score: Number(r[10]), ...(open === undefined ? {} : { open }), metrics });
    }
    return checked(rows, 9);
  },
};
export default board;
