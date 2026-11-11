// Publisher's released aggregate reference results. These are imported, not recomputed from participant records.
import type {Leaderboard,LeaderboardRow} from '../../leaderboards/types.ts';import {fetchJson} from '../util.ts';
const FEED='https://raw.githubusercontent.com/Handshake-AI-Research/studentbench/main/verification/figure_expected.json';
export function studentBoard(benchmark:string,kind:string,scope='combined'):Leaderboard{
 return {benchmark,url:'https://joinhandshake.com/research/benchmarks/studentbench/',feed:FEED,terms:'Handshake terms restrict bulk collection and republication. The almanac credits Handshake AI and links its published aggregate results.',
 ...(kind==='learning'?{chart:{title:'Learning gain vs. session cost',x:{key:'cost',label:'Mean session cost',unit:'$',better:'lower' as const},y:{key:'score',label:'Learning gain',unit:'percentage points',better:'higher' as const}}}:{}),
 async fetch():Promise<LeaderboardRow[]>{
  const d=await fetchJson<any>(FEED);const data=(input:string)=>{const c=d.checks.find((c:any)=>c.input===input);if(!c)throw new Error('StudentBench aggregate missing '+input);return c.expected;};
  const name=(arm:string)=>{const s=arm.match(/-(high|low|medium|med|none|off|xhigh)$/);let model=s?arm.slice(0,s.index):arm;if(/^(opus|sonnet)-/.test(model))model='claude-'+model;return {model,setting:s?.[1]};};
  if(kind==='planning'||kind==='practice')return data(`teaching/fit_${kind}_combined.json`).models.map((r:any)=>({...name(r.model),score:r.ability,metrics:{ciLow:r.lo,ciHigh:r.hi}}));
  const costs=data('costs/pareto_figure_data.json').rows;
  return data('learning/raw_arm_outcomes.csv').filter((r:any)=>r.scope===scope).map((r:any)=>{const c=costs.find((c:any)=>c.scope===scope&&c.arm_id===r.arm_id);return {...name(r.arm_id),score:r.mean_gain_pp,cost:c?.mean_cost_usd,metrics:{ciLowPercentagePoints:r.ci_low_pp,ciHighPercentagePoints:r.ci_high_pp,participants:r.n,...(c?{medianResponseSeconds:c.median_latency_s}: {})}};});
 }};
}
