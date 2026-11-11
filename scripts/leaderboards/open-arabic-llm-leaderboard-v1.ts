// Open Arabic LLM Leaderboard v1 public Gradio table. Average is the published percentage; task metrics and precision remain available. Community repository owners are retained to avoid base-model misidentification.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://oall-open-arabic-llm-leaderboard-v1.hf.space/config";
const board: Leaderboard = {
 benchmark: "open-arabic-llm-leaderboard-v1",
 url: "https://huggingface.co/spaces/OALL/Open-Arabic-LLM-Leaderboard-v1",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const d=await fetchJson<{components:{type:string;props:{value?:{headers:string[];data:unknown[][]}}}[]}>(FEED);
const t=d.components.find(c=>c.type==='dataframe'&&c.props.value?.headers.includes('Precision'))?.props.value;if(!t)throw new Error('OALL v1 table missing');
const h=t.headers;const makers=new Set(['Qwen','meta-llama','google','CohereForAI','microsoft','deepseek-ai','mistralai','01-ai','QCRI','ALLaM-AI','tiiuae']);
return t.data.filter(r=>typeof r[2]==='number'&&Number.isFinite(r[2])).map(r=>{const repo=text(String(r[1]));return {model:makers.has(repo.split('/')[0])?repo:repo.replace('/',' '),score:r[2] as number,setting:String(r[h.indexOf('Type')])+'; '+String(r[h.indexOf('Precision')]),metrics:Object.fromEntries(h.slice(3,17).map((k,i)=>[k,r[i+3]]).filter((p):p is [string,number]=>typeof p[1]==='number'&&Number.isFinite(p[1])))};});
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
