// OpenRSI publishes separate research tasks. Read each task's printed whole-run best score.
// The task pages identify harnesses and effort. Runtime includes process shutdown where the source says so.
// Marin's printed six-rung reward includes a measured result that failed staging guards.
// SGLang's one official reward belongs to an archived continuation, not current protocol v5.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { tables, num, text } from '../html.ts';
const BASE = 'https://index.openrsi.foundation/';
const tasks: Record<string,string> = {
 'Isaac Lab PegInsert Reward Search':'isaaclab-peginsert-reward-search',
 'Kev Decision Architecture':'kev-decision-architecture',
 'Molmo2 Video-Pointing Inference Strategy':'molmo2-pointing-refined',
 'ACE Playbook Inspection and Repair':'ace-playbook-repair',
 'MolmoWeb Interaction Context Allocation':'molmoweb-interaction-context',
 'ReasonIR Difficulty Curriculum':'reasonir-difficulty-curriculum',
 'Learnability-Aware Long/Short CoT Adaptation':'learnability-cot',
 'MInference 32-Head Sparse Prefill Kernel':'minference-sparse-prefill',
 'Marin Scaling Ladder':'marin-scaling-ladder',
 'SGLang Omni TTS Runtime':'sglang-omni-tts-runtime',
};
export const sourceBoard: Leaderboard = {
 benchmark:'openrsi-index',url:BASE,feed:BASE+'tasks/<task>.html (printed whole-run results)',
 terms:'The foundation publishes public task results and linked source records; attribution remains with the authors.',
 chart:{title:'Best task score versus research runtime',x:{key:'latency',label:'Research runtime',unit:'s',better:'lower'},y:{key:'score',label:'Native task score',unit:'score',better:'higher'},note:'Each point is a published whole-run best. Compare only the same task and protocol.'},
 async fetch(){throw new Error('Select an OpenRSI task record');}
};
export async function trackRows(select:string, _remove:string):Promise<LeaderboardRow[]> {
 const entry=Object.entries(tasks).find(([name])=>new RegExp(select).test(name+';'));
 if(!entry)throw new Error('Unknown OpenRSI task '+select);
 const [name,slug]=entry;const source=await fetchText(BASE+'tasks/'+slug+'.html');
 const rows:LeaderboardRow[]=[];
 if(slug==='marin-scaling-ladder'){
  const best=new Map<string,LeaderboardRow>();
  for(const m of source.matchAll(/<g\b([^>]*data-kind="measured"[^>]*)>\s*<title>([\s\S]*?)<\/title>/g)){
   const attrs=Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));
   const parts=text(m[2]).split(' · ');const score=Number(attrs['data-best']);const hours=Number(attrs['data-hour']);
   if(!Number.isFinite(score)||!Number.isFinite(hours))throw new Error('Invalid Marin result');
   const model=parts[1]==='GPT-5.6'?'GPT-5.6 Sol':parts[1]==='Opus 5'?'Claude Opus 5':parts[1];
   const r:LeaderboardRow={model,harness:parts[0],score,setting:/no staging|failed cost-based guards/.test(m[2])?'measured; staging guards failed':'measured; staged',metrics:{latency:hours*3600}};
   if(!best.has(model)||score>best.get(model)!.score)best.set(model,r);
  }
  rows.push(...best.values());
 }else{
  const table=tables(source).find(t=>t[0]?.some(c=>c.text==='Best'||c.text==='Best reward'));
  if(!table)throw new Error('OpenRSI best-score table missing: '+name);
  const head=table[0].map(c=>c.text);const reward=slug==='sglang-omni-tts-runtime';
  const scoreAt=head.indexOf(reward?'Best reward':'Best');
  for(const r of table.slice(1)){
   const score=num(r[scoreAt]?.text);if(score===undefined)continue;
   const model=text(r[0].html.replace(/<span\b[\s\S]*?<\/span>/g,'').replace(/<i\b[\s\S]*?<\/i>/g,''));
   const config=text(r[0].html.match(/<i\b[^>]*>([\s\S]*?)<\/i>/)?.[1]??'').split(' · ');
   const metrics:Record<string,number>={};
   const submissions=num(r[head.indexOf('Submissions')]?.text),hours=num(r[head.indexOf('Runtime')]?.text);
   if(submissions!==undefined)metrics.submissions=submissions;if(hours!==undefined)metrics.latency=hours*3600;
   if(reward){const throughput=num(r[head.indexOf('Best req/s')]?.text);if(throughput!==undefined)metrics.requestsPerSecond=throughput;}
   rows.push({model,harness:config[0]||undefined,setting:[...config.slice(1),...(reward?['archived continuation protocol, not v5']:[])].filter(Boolean).join('; ')||undefined,score,metrics});
  }
 }
 if(!rows.length)throw new Error('No whole-task OpenRSI scores: '+name);
 return rows;
}
