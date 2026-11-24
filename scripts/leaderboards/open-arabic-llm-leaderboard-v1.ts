// Open Arabic LLM Leaderboard v1 public Gradio table. Average is the published percentage; the table also publishes model licenses, sizes, Hub links and likes. Community repository owners are retained to avoid base-model misidentification.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://oall-open-arabic-llm-leaderboard-v1.hf.space/config";
const board: Leaderboard = {
 benchmark: "open-arabic-llm-leaderboard-v1",
 parts: {
   ACVA: { name: 'ACVA', group: 'Split' },
   AlGhafa: { name: 'AlGhafa', group: 'Split' },
   MMLU: { name: 'MMLU', group: 'Split' },
   EXAMS: { name: 'EXAMS', group: 'Split' },
   'ARC Challenge': { name: 'ARC Challenge', group: 'Split' },
   'ARC Easy': { name: 'ARC Easy', group: 'Split' },
   BOOLQ: { name: 'BoolQ', group: 'Split' },
   COPA: { name: 'COPA', group: 'Split' },
   HELLASWAG: { name: 'HellaSwag', group: 'Split' },
   'OPENBOOK QA': { name: 'OpenBookQA', group: 'Split' },
   PIQA: { name: 'PIQA', group: 'Split' },
   RACE: { name: 'RACE', group: 'Split' },
   SCIQ: { name: 'SciQ', group: 'Split' },
   TOXIGEN: { name: 'ToxiGen', group: 'Split' },
 },
 stats: {
   hubLikes: { name: 'Hub likes', unit: 'count' },
 },
 url: "https://huggingface.co/spaces/OALL/Open-Arabic-LLM-Leaderboard-v1",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const d=await fetchJson<{components:{type:string;props:{value?:{headers:string[];data:unknown[][]}}}[]}>(FEED);
const t=d.components.find(c=>c.type==='dataframe'&&c.props.value?.headers.includes('Precision'))?.props.value;if(!t)throw new Error('OALL v1 table missing');
const h=t.headers;const makers=new Set(['Qwen','meta-llama','google','CohereForAI','microsoft','deepseek-ai','mistralai','01-ai','QCRI','ALLaM-AI','tiiuae']);
return t.data.filter(r => typeof r[2] === 'number' && Number.isFinite(r[2])).map(r => {
  const cell = (key: string) => r[h.indexOf(key)];
  const repo = text(String(r[1]));
  const metrics: Record<string, number> = {};
  for (const key of Object.keys(board.parts ?? {})) {
    const value = cell(key);
    if (typeof value === 'number' && Number.isFinite(value)) metrics[key] = value;
  }
  const likes = cell('Hub ❤️');
  if (typeof likes === 'number') metrics.hubLikes = likes;
  const license = cell('Hub License'), params = cell('#Params (B)');
  return {
    model: makers.has(repo.split('/')[0]) ? repo : repo.replace('/', ' '), score: r[2] as number,
    setting: String(cell('Type')) + '; ' + String(cell('Precision')), metrics,
    license: typeof license === 'string' && !/^(?:unknown|n\/a|none|-)$/i.test(license) ? license : undefined,
    params: typeof params === 'number' && params > 0 ? params : undefined,
  };
});
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
