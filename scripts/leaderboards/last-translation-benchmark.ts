// Public API used by the official Model Leaderboard. Both modes use the complete LTBv1-eval set.
// Blind is the main evaluation; Oracle receives privileged information and stays explicitly labeled.
// Model release dates are not evaluation dates. Human translations remain outside model rows.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {fetchJson} from '../lib/util.ts';
const PAGE='https://last-translation-benchmark.vilda.net/leaderboard-results';
const API='https://last-translation-benchmark.vilda.net/api/leaderboard/results';
export default {benchmark:'last-translation-benchmark',url:PAGE,feed:`${API}?mode=blind&subset=LTBv1-eval (also mode=oracle)`,
 terms:'The official site restricts automated access in robots.txt; the almanac credits the Last Translation Benchmark authors and links the original source.',
 async fetch():Promise<LeaderboardRow[]> {
  const rows:LeaderboardRow[]=[];
  for(const mode of ['blind','oracle']){
   if(mode==='oracle')await new Promise(r=>setTimeout(r,1100));
   const data=await fetchJson<{models:{model_name:string;score:number;model_description?:string}[]}>(`${API}?mode=${mode}&subset=LTBv1-eval`);
   if(!Array.isArray(data.models))throw new Error('LTB models missing');
   for(const r of data.models){
    if(!r.model_name||/^human\b/i.test(r.model_name)||!Number.isFinite(r.score))continue;
    const ambiguous=/^(?:GPT-4o|GPT-4|GPT-3\.5 Turbo|Gemini 2\.5 (?:Pro|Flash)|DeepSeek [VR][13])$/i.test(r.model_name);
    rows.push({model:r.model_name+(ambiguous?' [snapshot unspecified]':''),score:r.score*100,setting:`LTBv1-eval; ${mode}${mode==='oracle'?'; privileged information':''}`});
   }
  }
  if(!rows.length)throw new Error('LTB scored rows missing');return rows;
 }
} satisfies Leaderboard;
