// 3SAT-Search: author-published AllRuns correct-rate means from the official SAT ZIP archives.
// The reports cover the released 960-formula dataset, not the early 800-formula paper description.
// Catalog proposal: update the task count before merging these rows. No aggregate is recomputed.
// Each score is the mean single-sample accuracy over repeated whole-set runs, converted to percent.
// Best-of-N and majority-vote reports are excluded. Category scores are not rows.
// Completion-token means are output tokens per task. The metric is the archive's usage_completion field.
// The paper and archived configs identify dated models. Ambiguous Phi research variants remain unlisted.
// The reader requests only ZIP directories and small report ranges, with public unauthenticated requests.
// Sources are live repository-head archives, though their stored experiments are historical.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';
import { hfZipEntries, hfZipTexts } from '../lib/boards/huggingface-zip-h2.ts';
const FEED = "https://huggingface.co/api/datasets/microsoft/Eureka-Bench-Logs/tree/main/SAT";
const board: Leaderboard = {
 benchmark: "3sat-search",
 url: "https://huggingface.co/datasets/microsoft/Eureka-Bench-Logs",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",
 chart: {title:"Accuracy versus token usage", x:{key:"outputTokens",label:"Output tokens per task",better:"lower",log:true}, y:{key:"score",label:"Accuracy",unit:"%",better:"higher"}},
 aliases: {"DeepSeek R1 (2025-01)":"deepseek-r1"},
 async fetch(): Promise<LeaderboardRow[]> {

 const dataset=await fetchJson<any>('https://huggingface.co/api/datasets/microsoft/sat');
 if(dataset.cardData?.dataset_info?.splits?.find((s:any)=>s.name==='train')?.num_examples!==960)throw new Error('SAT dataset revision changed: review catalog and archive coverage');
 await new Promise(r=>setTimeout(r,2100));
 const files=await fetchJson<{type:string,path:string}[]>(FEED);
 const archives=files.filter(x=>x.type==='file'&&/^SAT\/[^/]+\.zip$/.test(x.path));
 if(archives.length<6)throw new Error('SAT archive listing lost a model family');
 const rows:LeaderboardRow[]=[];
 const labels:Record<string,string>={
  nphard_sat_CLAUDE_3_7_SONNET_THINKING:'claude-3-7-sonnet-20250219',
  'nphard_sat_level_claude-3-5-sonnet-20241022':'claude-3-5-sonnet-20241022',
  nphard_sat1_deepseek_together:'DeepSeek R1 (2025-01)',
  nphard_sat_level_deepseek_distill_llama:'deepseek-r1-distill-llama-70b',
  'nphard_sat_gemini-2.0-pro':'gemini-2.0-pro-exp-02-05',
  'nphard_sat_level_gemini-2.0-flash-thinking-exp-01-21_2_no_code':'gemini-2.0-flash-thinking-exp-01-21',
  nphard_sat_level_llama3_1_405b_2:'llama-3-1-405b',
  nphard_sat1_o3_mini_reasoning_10_high_1_all_runs:'o3-mini',
  nphard_sat_gpt4o_2024_08_06:'gpt-4o-2024-08-06',
  'nphard_sat_level_o1_2024-12-17':'o1-2024-12-17',
  'nphard_sat_level_phi4_0-8':'phi-4',
  'Phi-4_reasoning':'Phi-4_reasoning (archive research variant)',
  'PHI_4_REASONING_phi-15b-rl':'PHI_4_REASONING_phi-15b-rl (archive research variant)',
  'PHI_4_REASONING_phi-16b':'PHI_4_REASONING_phi-16b (archive research variant)',
 };
 for(const file of archives) {
  const url='https://huggingface.co/datasets/microsoft/Eureka-Bench-Logs/resolve/main/'+file.path;
  const entries=await hfZipEntries(url);
  const scoreEntries=entries.filter(e=>/\/eval_report\/[^/]+_NPHardSATMetric_AllRuns_report\.json$/.test(e.name));
  if(!scoreEntries.length)throw new Error(`SAT archive has no headline reports: ${file.path}`);
  const folders=[...new Set(scoreEntries.map(e=>e.name.split('/eval_report/')[0]))];
  const wanted=entries.filter(e=>scoreEntries.includes(e)||folders.some(p=>e.name===p+'/config.txt'||(e.name.startsWith(p+'/eval_report/')&&e.name.endsWith('_UsageCompletion_AllRuns_report.json'))));
  const texts=await hfZipTexts(url,wanted);
  for(const folder of folders) {
   const run=folder.split('/')[1];if(!labels[run])throw new Error(`New SAT model needs identity review: ${run}`);
   const reports=scoreEntries.filter(e=>e.name.startsWith(folder+'/')).map(e=>JSON.parse(texts.get(e.name)!));
   if(reports.some(x=>JSON.stringify(x)!==JSON.stringify(reports[0])))throw new Error(`SAT duplicated reports disagree: ${run}`);
   const summary=reports[0];if(!Array.isArray(summary)||summary.length!==1)throw new Error('SAT headline schema changed');
   const result=summary[0].NPHardSATMetric_result?.correct;
   if(typeof result?.mean!=='number'||result.mean<0||result.mean>1)throw new Error('SAT score scale changed');
   const cfg=texts.get(folder+'/config.txt');if(!cfg)throw new Error('SAT model config missing');
   const research=labels[run].includes('archive research variant');
   const fields:string[]=[];
   if(!research) {
    const effort=cfg.match(/'reasoning_effort': '([^']+)'/)?.[1];if(effort)fields.push(`reasoning ${effort}`);
    const thinking=cfg.match(/'thinking_budget': (\d+)/)?.[1];if(thinking)fields.push(`thinking budget ${thinking}`);
    const limit=cfg.match(/'max_tokens': (\d+)/)?.[1];if(limit)fields.push(`max tokens ${limit}`);
   }
   const tokenEntry=wanted.find(e=>e.name.startsWith(folder+'/eval_report/')&&e.name.endsWith('_UsageCompletion_AllRuns_report.json'));
   const tokens=tokenEntry?JSON.parse(texts.get(tokenEntry.name)!)[0]?.usage_completion?.mean:undefined;
   if(tokens!==undefined&&(!Number.isFinite(tokens)||tokens<0))throw new Error('SAT token metric changed');
   rows.push({model:labels[run],score:result.mean*100,setting:fields.length?fields.join('; '):undefined,tokens,metrics:{accuracyStd:result.std*100,...(tokens===undefined?{}:{outputTokens:tokens})}});
  }
 }
 return checked(rows,10);

 },
};
export default board;
