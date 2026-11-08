// AMBER: the AMBER Score column is the whole-benchmark aggregate, higher is better.
// Generative and discriminative task metrics remain secondary metrics.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://arxiv.org/html/2311.07397";
const board: Leaderboard = {
 benchmark: "amber-hallucination",
 url: "https://arxiv.org/html/2311.07397",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.includes('AMBER Score'));
 if(!t)throw new Error('AMBER score table missing');
 return checked(t.filter(r=>r.length===10&&num(r[9])!==undefined).map(r=>({model:r[0]==='GPT-4V'?'GPT-4V (snapshot unspecified)':r[0],score:num(r[9])!,metrics:Object.fromEntries(['chair','coverage','hallucination','cognition','accuracy','precision','recall','f1'].map((k,i)=>[k,num(r[i+1])!]))})),9);
 },
};
export default board;
