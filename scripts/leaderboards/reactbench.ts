// ReactBench: latest published revision’s whole-benchmark pass rate, converted to percent.
// Preserve effort, harness, cost and tokens; older benchmark revisions never compete.
// Reads serialized live page data, retaining task costs, output tokens and uncertainty.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight } from '../lib/html.ts';

const FEED = "https://www.reactbench.com/";
const board: Leaderboard = {
 benchmark: "reactbench", url: "https://www.reactbench.com/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
chart:{title:'ReactBench score vs. cost',x:{key:'cost',label:'Cost per task',unit:'$',better:'lower'},y:{key:'score',label:'Pass rate',unit:'%',better:'higher'}},
 async fetch() {
const flight=nextFlight(await fetchText(FEED));const rows:LeaderboardRow[]=[];
for(const line of flight.split('\n')){const at=line.indexOf(':');if(at<0)continue;let x:any;try{x=JSON.parse(line.slice(at+1));}catch{continue;}
 const versions=x?.[3]?.value;if(!versions||typeof versions!=='object')continue;
 const latest=Object.keys(versions).filter(k=>/^v\d/.test(k)&&Array.isArray(versions[k]?.leaderboard)).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}))[0];
 for(const [revision,d]of Object.entries(versions) as [string,any][]){if(revision!==latest)continue;
 for(const r of d.leaderboard){if(!r.model||!Number.isFinite(r.passRate))continue;
 const harness=r.model.startsWith('cursor-')?'Cursor':r.id.includes('mini-swe-agent')?'mini-swe-agent':undefined;
 const model=r.model.replace(/^cursor-/,'');
 rows.push({model,score:r.passRate*100,setting:[revision,r.effort,r.id.split(':').slice(1).join(':')].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).join('; '),harness,cost:r.avgCost,tokens:r.avgOutTokens,metrics:{ciLow:r.ciLo*100,ciHigh:r.ciHi*100,trials:r.trials,scored:r.scored,...(r.testsOnly?{testsOnly:r.testsOnly.passRate*100}:{})}});
 }}}
if(!rows.length)throw new Error('Missing ReactBench serialized results');return rows;
 },
};
export default board;
