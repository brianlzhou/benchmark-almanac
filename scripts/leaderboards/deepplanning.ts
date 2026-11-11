// DeepPlanning v1.1: Avg Acc. is the headline percentage across travel and shopping planning.
// Six diagnostic scores and explicit reasoning effort are preserved from the static leaderboard.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://qwenlm.github.io/Qwen-Agent/en/benchmarks/deepplanning/";
const board: Leaderboard = {
 benchmark: "deepplanning",
 url: "https://qwenlm.github.io/Qwen-Agent/en/benchmarks/deepplanning/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Avg Acc.'));
  if(!t) throw new Error('DeepPlanning leaderboard missing');
  return t.slice(2).filter(r=>num(r[2]?.text)!==undefined).map(r=>{
    let model=r[1].text.replace(/^[^/]+\//,'');const effort=model.match(/(?:\s*\((max|high|medium|low|thinking|non-thinking|w\/ thinking|w\/o thinking)\)|-(high|low|medium))$/i);
    if(effort) model=model.slice(0,effort.index).trim();
    model=model.replace(/^Claude-(\d+[.]\d+)-(Opus|Sonnet)$/i, 'Claude $2 $1');
    return {model,score:num(r[2].text)!,setting:'v1.1'+(effort?'; '+(effort[1]??effort[2]).replace('w/o thinking','non-thinking').replace('w/ thinking','thinking'):''),
      metrics:Object.fromEntries(['travelCS','travelPS','travelComp','travelAcc','shoppingMatch','shoppingAcc'].map((h,i)=>[h,num(r[i+3].text)!]))};
  });
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
