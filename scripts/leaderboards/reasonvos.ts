// ReasonVOS / ReVOS: the paper reports whole-validation-set Overall J&F, including referring and reasoning queries.
// Backbones remain part of each trained system name. Category scores remain metrics.
// Catalog proposal: describe both explicit and implicit queries before accepting this overall score.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2407.11325";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "reasonvos",
  url: "https://github.com/cilinyan/VISA",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t=(await paperTables(FEED))[5];if(!t?.[0]?.some(c=>c.text==='overall'))throw new Error('ReVOS overall table changed');
    const rows=t.filter(r=>r.length===12&&num(r[10].text)!==undefined).map(r=>({model:paperModel(r[0].text)+' / '+r[1].text,score:num(r[10].text)!,metrics:{referringJF:num(r[4].text)!,reasoningJF:num(r[7].text)!,robustness:num(r[11].text)!}}));
    if(rows.length!==15)throw new Error('ReVOS expected 15 systems');return rows;
  },
};
export default board;
