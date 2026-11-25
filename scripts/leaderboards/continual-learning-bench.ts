// Continual Learning Bench: published aggregate normalized reward over six task sequences.
// Per-task tables give cumulative reward, gain, cost, their spreads and the run count.
// Aggregate cost sums each included task's mean single-rollout spend.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables,num } from '../lib/html.ts';
const URL='https://snorkel.ai/leaderboard/continual-learning-bench/';
const continualTasks = [
  ['blindSpectrumMonitoring','Blind spectrum monitoring'],
  ['codebaseAdaptation','Codebase adaptation'],
  ['cohortStudies','Cohort studies'],
  ['databaseExploration','Database exploration'],
  ['exploitablePoker','Exploitable poker'],
  ['salesPrediction','Sales prediction'],
] as const;
const continualParts: NonNullable<Leaderboard['parts']> = Object.fromEntries(
  continualTasks.map(([key,name]) => [key, { name, group: 'Task', unit: 'score', note: 'Cumulative reward on the task.' }]),
);
const continualStats: NonNullable<Leaderboard['stats']> = { gain:{name:'Aggregate gain',unit:'score',better:'higher'} };
for (const [key,name] of continualTasks) {
  continualStats[key+'Gain']={name:name+' gain',unit:'score',better:'higher'}; continualStats[key+'Cost']={name:name+' cost',unit:'usd',better:'lower'};
}
const board:Leaderboard={benchmark:'continual-learning-bench',costPer:'run',url:URL,feed:URL,parts:continualParts,stats:continualStats,
 terms:'Snorkel terms prohibit automated extraction and republication. Benchmark Almanac credits Snorkel AI and links the source.',
 chart:{title:'Aggregate reward vs. average evaluation cost',x:{key:'cost',label:'Average evaluation cost',unit:'$',better:'lower'},y:{key:'score',label:'Aggregate reward',better:'higher'}},
 async fetch(){
   const html=await fetchText(URL);
   const t=tables(html).find(t=>t[0]?.some(c=>c.text==='Avg Reward'));
   if(!t) throw new Error('Continual Learning aggregate table missing');
   const metricsBySystem=new Map<string,Record<string,number>>();
   const counts=new Map<string,number[]>();
   for (const match of html.matchAll(/data-task="([\w-]+)"[^>]*>\s*(?:<div\b[^>]*>\s*)?(<table\b[\s\S]*?<\/table>)/g)) {
     const table=tables(match[2])[0];
     if(!table?.[0]?.some(c=>c.text==='Runs')) continue;
     const key=match[1].replace(/_(.)/g,(_,c:string)=>c.toUpperCase());
     for (const [system,reward,gain,cost,runs] of table.slice(1)) {
       const metrics=metricsBySystem.get(system.text) ?? {};
       for (const [cell,suffix] of [[reward,''],[gain,'Gain'],[cost,'Cost']] as const) {
         const [mean,spread]=cell.text.split('±').map(num);
         if(mean!==undefined) metrics[key+suffix]=mean;
         if(spread!==undefined) metrics[key+suffix+'Std']=spread;
       }
       const n=num(runs.text);
       if(n!==undefined) counts.set(system.text,[...(counts.get(system.text)??[]),n]);
       metricsBySystem.set(system.text,metrics);
     }
   }
   return t.slice(1).map(r=>{
     const system=r[1].text;
     const [harness,name]=system.split(' · ');
     const ns=counts.get(system);
     return {model:/^(Sonnet|Opus|Fable|Haiku)\b/.test(name)?'Claude '+name:name,harness,score:num(r[2].text)!,
       cost:num(r[4].text), trials:ns?.length===6 && ns.every(n=>n===ns[0]) ? ns[0] : undefined,
       metrics:{...metricsBySystem.get(system),gain:num(r[3].text)!}};
   });
 }};
export default board;
