// GSM8K-V: the main and complete tables report GSM8K-V Avg. in the penultimate column.
// The final column belongs to text-only GSM8K and is excluded. Human references are excluded.
// Thinking is a whole-benchmark configuration. Overlapping main and appendix scores must agree.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2509.25160";
const board: Leaderboard = {
 benchmark: "gsm8k-v",
 url: "https://arxiv.org/html/2509.25160",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const ts=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).filter(t=>t[0]?.join('|')==='Model|GSM8K-V|GSM8K');
 if(!ts.length)throw new Error('GSM8K-V results missing');
 const out=new Map<string,LeaderboardRow>();
 for(const t of ts)for(const r of t.slice(2)){if(r.length!==9||num(r[7])===undefined||/^Human/.test(r[0]))continue;
 const name=r[0].replace(/\s*\([^)]*et al[^)]*\)/g,'');const score=num(r[7])!;
 if(out.has(name)&&out.get(name)!.score!==score)throw new Error('GSM8K-V tables disagree: '+name);
 out.set(name,{model:name.replace(/-Thinking$/,''),setting: name.endsWith('-Thinking')?'thinking':undefined,score,metrics:Object.fromEntries(['signboardIcon','measurement','physicalMetric','temporal','ratioPercentage','other'].map((k,i)=>[k,num(r[i+1])!]))});}
 return checked([...out.values()],25);
 },
};
export default board;
