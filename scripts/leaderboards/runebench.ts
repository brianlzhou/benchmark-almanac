// RuneBench's current main board: all 16 skills, 30 minutes per task.
// Reproduce CostTable.js's mean ln(1 + normalized peak XP/min); exclude incomplete sweeps.
// Remote JavaScript is parsed as data, never evaluated.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const ROOT='https://maxbittker.github.io/runebench/';
const board:Leaderboard={benchmark:'runebench',url:ROOT,feed:ROOT+'results/skills-30m/_data.js',
 terms:'Public RuneBench results. Benchmark Almanac credits Websim and links the source.',
 aliases:{'Beam 1.0 501B':'beam-1-0','Qwen3.5 35B':'qwen3-5-35b-a3b','Mistral Large 4 (open weights)':'mistral-large-4-le-chonk','Codex CLI 5.3':'gpt-5-3-codex'},
 chart:{title:'Skill performance vs cost',x:{key:'cost',label:'Mean cost per skill run',unit:'$',better:'lower',log:true},y:{key:'score',label:'Mean ln(1 + peak XP/min)',better:'higher'}},
 async fetch():Promise<LeaderboardRow[]>{
  const source=await fetchText(ROOT+'views/shared-constants.js');
  const config=source.match(/const MODEL_CONFIG = \{([\s\S]*?)\n\};/)?.[1];
  const skills=[...((source.match(/const SKILL_ORDER = \[([\s\S]*?)\]/)?.[1])??'').matchAll(/'([^']+)'/g)].map(m=>m[1]);
  const names=Object.fromEntries([...(config??'').matchAll(/'([^']+)'\s*:\s*\{\s*displayName:\s*'([^']+)'/g)].map(m=>[m[1],m[2]]));
  const raw=await fetchText(ROOT+'results/skills-30m/_data.js');
  const match=raw.match(/^\s*window\.COMBINED_DATA\s*=\s*([\s\S]*?);?\s*$/);
  if(!match||skills.length!==16||!Object.keys(names).length)throw new Error('RuneBench data schema changed');
  const data=JSON.parse(match[1]); const rows:LeaderboardRow[]=[];
  for(const [key,r] of Object.entries(data) as [string,any][]){
   if(!names[key]||skills.some(s=>!r[s]))continue;
   let sum=0,cost=0,count=0,input=0,output=0,turns=0,turnCount=0;
   for(const s of skills){const d=r[s];sum+=Math.log1p(d.peakXpRate||0);
    if(d.tokenUsage?.costUsd!=null){cost+=d.tokenUsage.costUsd;count++;input+=d.tokenUsage.inputTokens||0;output+=d.tokenUsage.outputTokens||0;}
    const calls=d.toolCalls??(d.trajectory?.length?d.trajectory.filter((x:any)=>x.source==='tool').length:undefined);
    if(calls!==undefined){turns+=calls;turnCount++;}
   }
   const m=names[key].match(/^(.*?)(?: (xhigh|high|medium|low|max|fast))?$/)!;
   rows.push({model:m[1],setting:['30 minutes',m[2]].filter(Boolean).join('; '),score:sum/skills.length,
    cost:count?cost/count:undefined,tokens:count?output/count:undefined,
    metrics:{skills:skills.length,...(count?{inputTokens:input/count,pricedRuns:count}:{}),...(turnCount?{toolCalls:turns/turnCount}:{})}});
  }
  if(!rows.length)throw new Error('RuneBench has no complete sweeps');return rows;
 }};
export default board;
