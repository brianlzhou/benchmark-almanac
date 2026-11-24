// PhyWorldBench tests whether generated videos follow physical laws and match their prompts.
// Tables 3 and 7 report the fraction satisfying both criteria under human and CAP evaluation.
import type { Leaderboard, LeaderboardRow } from "./types.ts";
import { checked, grid, paperTables } from "../lib/boards/arxiv-span-tables.ts";
import { paperHtml } from "../lib/boards/arxiv-throttled.ts";

const feed = "https://arxiv.org/html/2507.13428";
const board: Leaderboard = {
  benchmark: "phyworldbench",
  url: feed, feed, static: "paper",
  terms: "The authors publish the paper under the terms linked at https://arxiv.org/abs/2507.13428",
  parts: {}, stats: { sa: { name: 'Semantic adherence', unit: 'score' }, pc: { name: 'Physical commonsense', unit: 'score' } },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const human = tables.find(t => t[0][1] === 'Fundamental Physics' && t[0][12] === 'Overall Performance');
    const auto = tables.find(t => t[0].join('|') === 'Model|SA|PC|Both');
    const detail = tables.find(t => t[1]?.[1] === 'C1' && t[1][30] === 'C10');
    if (!human || !auto || !detail || human[1][12] !== 'Both') throw new Error('Missing PhyWorldBench results');
    const rows: LeaderboardRow[] = [];
    for (const [setting,t,offset] of [['Human evaluation',human,10],['CAP evaluation',auto,1]] as const) {
      for (const r of t.slice(setting === 'Human evaluation' ? 2 : 1)) {
        if (r[0] === r[1]) continue;
        const model = r[0].split(' (')[0];
        const metrics: Record<string,number> = { sa: Number(r[offset]), pc: Number(r[offset+1]) };
        if (setting === 'Human evaluation') {
          const sub = detail.find(line => line[0] === model);
          if (!sub) throw new Error('Missing category scores');
          for (const [labels,values,end] of [[t[0],r,9],[detail[1],sub,30]] as const) {
            for (let i=3; i<=end; i+=3) {
              const key = labels[i];
              board.parts![key] = key;
              metrics[key] = Number(values[i]);
            }
          }
        }
        rows.push({ model, setting, score: Number(r[offset+2]), metrics });
      }
    }
    return checked(rows,24);
  },
};
export default board;
