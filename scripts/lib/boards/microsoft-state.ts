import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { jsLiteral } from '../html.ts';
const PAGE='https://microsoft.github.io/STATE-Bench/leaderboard/';
type Entry={track:string;benchmarkVersion:string;model:string;agent?:string;reasoningLabel?:string;submissionDate?:string;metrics:Record<string,unknown>};
export function stateBoard(benchmark:string,track:string,version:string):Leaderboard{return {
 benchmark,url:PAGE,feed:PAGE+'leaderboard.js',
 terms:'Official static leaderboard script from the MIT-licensed Microsoft STATE-Bench repository. The almanac credits and links the source.',
 async fetch(){const js=(await fetchText(PAGE+'leaderboard.js')).replace(/:\s*undefined\b/g,': null');
 const start=js.indexOf('[',js.indexOf('const entries'));if(start<0)throw new Error('STATE entries missing');
 const entries=jsLiteral<Entry[]>(js,start).filter(e=>e.track===track&&e.benchmarkVersion===version);
 const rows:LeaderboardRow[]=[];for(const e of entries){if(typeof e.metrics.overallPassAt1!=='number')continue;
 const metrics:Record<string,number>={};
 for(const [k,v] of Object.entries({pass5:e.metrics.passAt5,std:e.metrics.overallPassAt1Std,ux:e.metrics.meanUxScore}))if(typeof v==='number')metrics[k]=v;
 for(const [k,v] of Object.entries(e.metrics))if(typeof v==='number')metrics[k]=v;
 for(const [domain,values] of Object.entries((e.metrics.domains||{}) as Record<string,Record<string,unknown>>))for(const [k,v] of Object.entries(values))if(typeof v==='number')metrics[domain+':'+k]=v;
 const [model,memory]=e.model.split(' + ');
 rows.push({model,score:e.metrics.overallPassAt1,setting:e.reasoningLabel&&e.reasoningLabel!=='default'?e.reasoningLabel:undefined,harness:memory||e.agent||undefined,date:e.submissionDate,cost:typeof e.metrics.costPerTask==='number'?e.metrics.costPerTask:undefined,metrics});}
 if(!rows.length)throw new Error('STATE version has no rows');return rows;}
};}
