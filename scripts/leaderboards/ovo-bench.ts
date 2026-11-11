// OVO-Bench: Table 1 publishes Overall Avg. across the three capability groups, in percent.
//  Frame budgets describe whole-benchmark configurations. The three group averages remain metrics.
//  Models without an Overall Avg. are incomplete and excluded. These static paper rows will not refresh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2501.05510";
import { paperTables, paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "ovo-bench",
  url: "https://joeleelyf.github.io/OVO-Bench/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = (await paperTables(FEED)).find(t => t.some(r => r.some(c => c.text === 'Overall Avg.')));
    if (!t) throw new Error('OVO-Bench results table missing');
    const out = t.filter(r => r.length === 18 && !/^Human/.test(r[0].text) && num(r[17].text) !== undefined).map(r => ({model: paperModel(r[0].text), score: num(r[17].text)!, setting: `${r[1].text} frames`, metrics: {realTime: num(r[8].text)!, backward: num(r[12].text)!, forward: num(r[16].text)!}}));
    if (out.length !== 10) throw new Error(`OVO-Bench expected ten complete rows, found ${out.length}`);
    return out;
  },
};
export default board;
