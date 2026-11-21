// BioMaze tests biological causal reasoning with true-false and open-ended questions.
// The source reports no overall score. The headline is the plain mean of seven open-ended task parts.
// This importer reads Table 3 of the benchmark paper and keeps each task category in metrics.
import type {BoardStat,Leaderboard,LeaderboardRow} from './types.ts'; import {paperTables} from '../lib/boards/arxiv-nested-tables.ts'; import {checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2502.16660'; const parts=['normal','perturbed','natural','intervened','single','interaction','function'];
const stats:Record<string,BoardStat>=Object.fromEntries(parts.flatMap(name=>[
 [`f0${name[0].toUpperCase()+name.slice(1)}`,{name:`${name} true/false accuracy`,unit:'%',better:'higher'}],
 [`f1${name[0].toUpperCase()+name.slice(1)}`,{name:`${name} open-ended accuracy`,unit:'%',better:'higher'}],
]));
const board:Leaderboard={benchmark:'biomaze',static:'paper',url:URL,feed:URL,terms:'The authors publish the paper publicly at https://arxiv.org/abs/2502.16660.',headline:'The paper reports no overall score, so this is the plain mean of its seven open-ended task scores.',parts:Object.fromEntries(parts.map(name=>[name,{name}])),stats,async fetch(){const t=await paperTables(URL).then(x=>x[7]);if(!t)throw new Error('BioMaze Table 3 missing');const out:LeaderboardRow[]=[];let model='';for(const r of t.slice(2)){if(!r[0]?.text)continue;const candidate=r.slice(-7).map(c=>Number(c.text)); if(candidate.some(v=>!Number.isFinite(v))||candidate.every(v=>v===0)){if(r[0]?.text)model=r[0].text;continue} const setting=r[0].text;const vals=candidate;if(vals.some(v=>!Number.isFinite(v)))continue;const metrics=Object.fromEntries(parts.map((p,i)=>[p,vals[i]]));out.push({model,setting,score:vals.reduce((a,b)=>a+b,0)/7,metrics})}return checked(out,10)}};export default board;
