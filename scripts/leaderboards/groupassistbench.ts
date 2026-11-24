// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Table 3 scores memory recall and memory use in group conversations. Table 13 gives deployment costs.
import type { Leaderboard, LeaderboardRow } from "./types.ts";
import { checked, grid, paperTables } from "../lib/boards/arxiv-span-tables.ts";
import { paperHtml } from "../lib/boards/arxiv-throttled.ts";

const feed = "https://arxiv.org/html/2611.04867";
const board: Leaderboard = {
  benchmark: "groupassistbench",
  url: feed, feed, static: "paper",
  terms: "The authors publish the paper under the terms linked at https://arxiv.org/abs/2611.04867",
  headline: 'The paper reports no overall score, so this is the plain mean of its memory recall and memory use scores.',
  parts: { recall: 'L1 memory recall', use: 'L2 memory use' },
  reference: ['Full Context'], harnesses: 'system',
  stats: { contextTokens: { name: 'Context tokens', unit: 'tokens' }, construction: { name: 'Construction cost', unit: 'usd' }, deployment: { name: 'Deployment cost', unit: 'usd' } },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const t = tables.find(t => t[0][1] === 'Memory type' && t[0][8]?.startsWith('L1 avg.') && t[0][13]?.startsWith('L2 avg.'));
    const costs = tables.find(t => t[0][1] === 'Construction cost (USD)' && t[0][2] === 'Cost/query (USD)');
    if (!t || !costs || t[0][15] !== 'Ctx. tokens') throw new Error('Missing main scores or costs');
    let group = '';
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      if (r[0] === r[1]) { group = r[0]; continue; }
      const full = group === 'Full Context';
      const model = full ? r[0] : 'GPT-5.6-terra';
      const harness = full ? group : r[0];
      const recall = Number(r[8]), use = Number(r[13]);
      const metrics: Record<string,number> = { recall, use, contextTokens: Number(r[15].replaceAll(',', '')) };
      for (let i = 0; i < 3; i++) {
        for (const [label,col] of [['L1 met',2+i*2],['L1 F1',3+i*2],['L2 rubric score',10+i]] as const) {
          const key = label + ' M' + (i+1);
          metrics[key] = Number(r[col]);
          board.parts![key] = { name: key, group: 'Memory dependency' };
        }
      }
      const c = costs.find(c => c[0] === (full ? model === 'GPT-5.6-terra' ? 'Full Context (Terra)' : '' : harness));
      if (!full && !c) throw new Error('Missing system cost');
      if (c) { metrics.construction = Number(c[1].replaceAll(',','')); metrics.deployment = Number(c[4].replaceAll(',','')); }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid memory metric');
      rows.push({ model, harness, score: (recall + use)/2, metrics, ...(c && { cost: Number(c[2]) }) });
    }
    return checked(rows, 14);
  },
};
export default board;
