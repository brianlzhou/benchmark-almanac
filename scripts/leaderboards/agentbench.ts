// AgentBench: the original benchmark Table 3 reports normalized Overall (OA), not a percentage.
// The catalog needs unit score. Eight environment results remain metrics. Original AgentBench and AgentBench FC stay separate.
// This importer must wait for the catalog correction.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2308.03688";
const board: Leaderboard = {
 benchmark: "agentbench",
 url: "https://arxiv.org/html/2308.03688",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const raw=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='OA'));
 if(!raw)throw new Error('AgentBench OA table missing');
 const n=(s:string)=>num(s.replace(/\s/g,''))!;
 return checked(grid(raw).slice(2).filter(r=>r.length===12&&num(r[3])!==undefined).map(r=>({model:r[1]+(r[2]==='-'?'':' '+r[2]),score:n(r[3]),metrics:Object.fromEntries(['os','database','knowledgeGraph','cardGame','lateralThinking','houseHolding','webShopping','webBrowsing'].map((k,i)=>[k,n(r[i+4])]))})),27);
 },
};
export default board;
