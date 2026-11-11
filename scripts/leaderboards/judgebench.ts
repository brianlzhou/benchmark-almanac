// JudgeBench: read the Space config dataframes, which the official app computes from its JSONL
// pairwise judgments. Use the first/default GPT-4o response dataset, including Nemotron results
// appended to that view. Claude response-dataset scores do not become separate leaderboard rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://scalerlab-judgebench.hf.space/config";
const board: Leaderboard = {
 benchmark: "judgebench", url: "https://huggingface.co/spaces/ScalerLab/JudgeBench", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const cfg=await fetchJson<{components:{type:string;props:{value?:{headers:string[];data:any[][]}}}[]}>(FEED);const ts=cfg.components.map(c=>c.props.value).filter(v=>v?.headers?.includes('Overall Score'));if(ts.length!==2)throw new Error('Expected two JudgeBench datasets');const rows:LeaderboardRow[]=[];const nemotron=new Set<string>();
for(const [i,t] of ts.slice(0,1).entries())for(const r of t!.data){let model=String(r[1]);let harness:string|undefined;let effort:string|undefined;const n=/Nemotron/i.test(model);if(n){if(nemotron.has(model))continue;nemotron.add(model);}const m=model.match(/^(.+?) \((.+)\)$/);if(m){harness=m[1];model=m[2];const e=model.match(/\s*\((high|medium|low)\)$/i);if(e){effort=e[1];model=model.slice(0,e.index);}}const score=Number(r[7]);if(!Number.isFinite(score))continue;rows.push({model,score,harness,setting:[r[2],effort].filter(Boolean).join('; '),metrics:{knowledge:Number(r[3]),reasoning:Number(r[4]),math:Number(r[5]),coding:Number(r[6])}});}
return rows;
 },
};
export default board;
