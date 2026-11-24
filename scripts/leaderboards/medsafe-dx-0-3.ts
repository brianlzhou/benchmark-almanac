// The full 900-case v0.3 headline, prompt 4aj only, as in the README. Excludes sensitivity analyses.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED = "https://raw.githubusercontent.com/cortico-health/MedSafe-Dx/HEAD/results/v03_full/scores.json";
type Value = {value:number;ci:[number,number]};
type ParseInfo = {cases?:number;answered?:number;unreadable?:number;errored?:number;no_justification?:number;cost_usd?:number};
const board: Leaderboard = {
 benchmark:'medsafe-dx-0-3', url:'https://github.com/cortico-health/MedSafe-Dx', feed:FEED,
 terms:'CC BY-NC-ND 4.0 repository; factual headline results are attributed in their published units; raw.githubusercontent.com has no robots.txt.',
 costPer:'run',
 stats:{
  scoreMix:{name:'Mixed-prevalence score',unit:'score',better:'higher'},
  underEscalation:{name:'Under-escalation rate',unit:'%',better:'lower'},
  overEscalation:{name:'Over-escalation rate',unit:'%',better:'lower'},
  partial:{name:'Partial credit rate',unit:'%'},
  partialInlist:{name:'In-list partial rate',unit:'%'},
  partialOfflist:{name:'Off-list partial rate',unit:'%'},
  partialTruth:{name:'Ground-truth partial rate',unit:'%'},
  passRate:{name:'Pass rate',unit:'%',better:'higher'},
  escalationRate:{name:'Escalation rate',unit:'%'},
  unreadable:{name:'Unreadable answers',unit:'count',better:'lower'},
  errored:{name:'Errored cases',unit:'count',better:'lower'},
  noJustification:{name:'Answers without justification',unit:'count',better:'lower'},
 },
 chart:{
  title:'Misses versus over-escalations',
  x:{key:'overEscalation',label:'Over-escalation rate',unit:'%',better:'lower'},
  y:{key:'underEscalation',label:'Under-escalation rate',unit:'%',better:'lower'},
  note:'Lower-left is better. On the source site, the vertical axis also adds one seventh of the partial credit rate.',
 },
 async fetch() {
  const d = await fetchJson<{headline_within_condition:{headline_cases:number;rows:Record<string,Record<string,Value>>};parse?:Record<string,ParseInfo>}>(FEED);
  if(d.headline_within_condition.headline_cases !== 900) throw new Error('v0.3 case count changed');
  const rows=Object.entries(d.headline_within_condition.rows).filter(([k])=>k.endsWith('|4aj')).map(([key,r])=>{
   const p=d.parse?.[key];
   const metrics:Record<string,number>={ciLow:r.score_z_bal.ci[0],ciHigh:r.score_z_bal.ci[1],underEscalation:r.U.value,overEscalation:r.O.value};
   if(r.score_z_mix){metrics.scoreMix=r.score_z_mix.value;metrics.scoreMixLow=r.score_z_mix.ci[0];metrics.scoreMixHigh=r.score_z_mix.ci[1];}
   if(r.partial)metrics.partial=r.partial.value;
   if(r.partial_inlist)metrics.partialInlist=r.partial_inlist.value;
   if(r.partial_offlist)metrics.partialOfflist=r.partial_offlist.value;
   if(r.partial_truth)metrics.partialTruth=r.partial_truth.value;
   if(r.pass)metrics.passRate=r.pass.value;
   if(r.esc)metrics.escalationRate=r.esc.value;
   if(typeof p?.unreadable==='number')metrics.unreadable=p.unreadable;
   if(typeof p?.errored==='number')metrics.errored=p.errored;
   if(typeof p?.no_justification==='number')metrics.noJustification=p.no_justification;
   return {
    model:key.split('|')[0], setting:'v0.3 full, prompt 4aj', score:r.score_z_bal.value,
    low:r.score_z_bal.ci[0], high:r.score_z_bal.ci[1],
    trials:typeof p?.cases==='number'?p.cases:undefined,
    cost:typeof p?.cost_usd==='number'?p.cost_usd:undefined,
    metrics,
   };
  });
  if(rows.length<3)throw new Error('No v0.3 headline rows');return rows;
 }
};
export default board;
