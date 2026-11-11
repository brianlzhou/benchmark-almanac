// LLaVA-Bench In-the-Wild: Table 5 All is the relative score against GPT-4 reference answers, out of 100.
// The separate 85.1 figure belongs to the synthetic instruction set, not In-the-Wild.
// The dagger row repeats judging on fixed answers, so it is not another model run.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2304.08485";
const board: Leaderboard = {
 benchmark: "llava-bench-in-the-wild",
 url: "https://arxiv.org/html/2304.08485",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.includes('Complex reasoning')&&t.some(r=>r[0].startsWith('OpenFlamingo')));
 if(!t)throw new Error('LLaVA In-the-Wild comparison missing');
 return checked(t.slice(1).filter(r=>r.length===5&&!r[0].includes('†')).map(r=>({model:r[0],score:num(r[4])!,metrics:{conversation:num(r[1])!,description:num(r[2])!,reasoning:num(r[3])!}})),3);
 },
};
export default board;
