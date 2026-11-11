// CFBench: Full Set PSR is the headline priority satisfaction rate, converted from a fraction to percent.
// Tables 2 and 7 cover the same benchmark. Their overlapping rows agree. Easy and Hard scores remain metrics.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2408.01122";
const board: Leaderboard = {
 benchmark: "cfbench",
 url: "https://arxiv.org/html/2408.01122",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const ts=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).filter(t=>t[0]?.join('|')==='Models|Easy Set|Hard Set|Full Set');
 if(!ts.length)throw new Error('CFBench tables missing');
 const out=new Map<string,LeaderboardRow>();
 for(const t of ts)for(const r of t.slice(2)) {if(r.length!==10||num(r[9])===undefined)continue;
 const model=r[0].replace(/[†∗*]/g,'').trim(); const score=num(r[9])!*100;
 if(out.has(model)&&Math.abs(out.get(model)!.score-score)>1e-6)throw new Error('CFBench tables disagree: '+model);
 out.set(model,{model,score,metrics:Object.fromEntries(['easyCSR','easyISR','easyPSR','hardCSR','hardISR','hardPSR','fullCSR','fullISR'].map((k,i)=>[k,num(r[i+1])!*100]))});}
 return checked([...out.values()],50);
 },
};
export default board;
