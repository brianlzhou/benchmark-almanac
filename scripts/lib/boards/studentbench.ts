// Publisher's released aggregate reference results. These are imported, not recomputed from participant records.
import type {Leaderboard,LeaderboardRow} from '../../leaderboards/types.ts';import {fetchJson} from '../util.ts';
const FEED='https://raw.githubusercontent.com/Handshake-AI-Research/studentbench/main/verification/figure_expected.json';
export function studentBoard(benchmark:string,kind:string,scope='combined'):Leaderboard{
 return {benchmark,url:'https://joinhandshake.com/research/benchmarks/studentbench/',feed:FEED,terms:'Handshake terms restrict bulk collection and republication. The almanac credits Handshake AI and links its published aggregate results.',notModels:/^control$/i,
 ...(kind==='learning'&&scope==='combined'?{parts:{quant:{name:'Quantitative',note:'Mean learning gain on quantitative topics, in percentage points.'},verbal:{name:'Verbal',note:'Mean learning gain on verbal topics, in percentage points.'}}}:{}),
 stats:{participants:{name:'Participants',unit:'count'},medianResponseSeconds:{name:'Median response time',unit:'seconds',better:'lower'},adjustedGain:{name:'ANCOVA adjusted learning gain',unit:'score',better:'higher',note:'Covariate-adjusted marginal learning gain in percentage points.'},meanStudentMessages:{name:'Mean student messages',unit:'count'},costPerGainPp:{name:'Cost per percentage point gained',unit:'usd',better:'lower'},strategyScore:{name:'Instructional strategy score',unit:'%',better:'higher',note:'Share of six instructional strategies observed in tutoring conversations.'},flagRate:{name:'Flagged answers per 100',unit:'score',better:'lower',note:'Flagged tutoring responses per 100 student-answered items.'}},
 ...(kind==='learning'?{chart:{title:'Learning gain vs. session cost',x:{key:'cost',label:'Mean session cost',unit:'$',better:'lower' as const},y:{key:'score',label:'Learning gain',unit:'percentage points',better:'higher' as const}}}:{}),
 async fetch():Promise<LeaderboardRow[]>{
  const d=await fetchJson<any>(FEED);const data=(input:string)=>{const c=d.checks.find((c:any)=>c.input===input);if(!c)throw new Error('StudentBench aggregate missing '+input);return c.expected;};
  const name=(arm:string)=>{const s=arm.match(/-(high|low|medium|med|none|off|xhigh)$/);let model=s?arm.slice(0,s.index):arm;if(/^(opus|sonnet)-/.test(model))model='claude-'+model;return {model,setting:s?.[1]};};
  if(kind==='planning'||kind==='practice')return data(`teaching/fit_${kind}_combined.json`).models.map((r:any)=>({...name(r.model),score:r.ability,low:r.lo,high:r.hi,metrics:{ciLow:r.lo,ciHigh:r.hi}}));
  const raw=data('learning/raw_arm_outcomes.csv');
  const costs=data('costs/pareto_figure_data.json').rows;
  const ancova=data('learning/ancova_adjusted_arm_outcomes.csv');
  const eff=data('costs/cost_efficiency_by_arm_scope.csv');
  const strat=data('teaching/conversation_strategy_prevalence.csv');
  const flags=data('teaching/flag_rates.csv');
  return raw.filter((r:any)=>r.scope===scope).map((r:any)=>{
   const c=costs.find((c:any)=>c.scope===scope&&c.arm_id===r.arm_id);
   const a=ancova.find((x:any)=>x.scope===scope&&x.arm_id===r.arm_id);
   const e=eff.find((x:any)=>x.scope===scope&&x.arm_id===r.arm_id);
   const st=strat.find((x:any)=>x.scope===scope&&x.arm===r.arm_id);
   const fl=flags.find((x:any)=>x.scope===scope&&x.model_preset===r.arm_id);
   const q=scope==='combined'?raw.find((x:any)=>x.scope==='quant'&&x.arm_id===r.arm_id):undefined;
   const v=scope==='combined'?raw.find((x:any)=>x.scope==='verbal'&&x.arm_id===r.arm_id):undefined;
   return {...name(r.arm_id),score:r.mean_gain_pp,low:r.ci_low_pp,high:r.ci_high_pp,cost:c?.mean_cost_usd,metrics:{ciLow:r.ci_low_pp,ciHigh:r.ci_high_pp,participants:r.n,...(c?{medianResponseSeconds:c.median_latency_s,...(typeof c.mean_student_messages==='number'?{meanStudentMessages:c.mean_student_messages}:{})}:{}),...(typeof a?.adjusted_marginal_gain_pp==='number'?{adjustedGain:a.adjusted_marginal_gain_pp}:{}),...(typeof e?.cost_per_gain_pp==='number'?{costPerGainPp:e.cost_per_gain_pp}:{}),...(typeof st?.mean_strategy_score==='number'?{strategyScore:st.mean_strategy_score*100}:{}),...(typeof fl?.flags_per_100_answered==='number'?{flagRate:fl.flags_per_100_answered}:{}),...(typeof q?.mean_gain_pp==='number'?{quant:q.mean_gain_pp}:{}),...(typeof v?.mean_gain_pp==='number'?{verbal:v.mean_gain_pp}:{})}};
  });
 }};
}
