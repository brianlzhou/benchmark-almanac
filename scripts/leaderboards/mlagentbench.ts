// MLAgentBench: the paper success-rate table publishes Average across all 13 tasks.
// The starter-code baseline is excluded. Task success rates stay in metrics.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2310.03302";
const board: Leaderboard = {
 benchmark: "mlagentbench",
 url: "https://arxiv.org/html/2310.03302",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const ts=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text)));
 const t=ts.find(t=>t[0]?.[0]==='Task'&&t[0]?.includes('Claude v3 Opus')&&t.some(r=>r[0]==='Average'));
 if(!t)throw new Error('MLAgentBench success table missing');
 const avg=t.find(r=>r[0]==='Average')!;
 return checked(t[0].slice(1,-1).map((model,j)=>({model:model==='Mixtral'?'Mixtral (size unspecified)':model,score:num(avg[j+1])!,metrics:Object.fromEntries(t.slice(1).filter(r=>r[0]!=='Average'&&num(r[j+1])!==undefined).map(r=>[r[0],num(r[j+1])!]))})),7);
 },
};
export default board;
