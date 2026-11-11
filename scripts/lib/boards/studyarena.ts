// StudyArena's Next.js payload publishes separate text, image and audio rankings.
// Topic filters of text votes stay within the text board. Zero-vote prior ratings are not observations.
import type { LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { nextFlight, jsonAfter } from '../html.ts';
interface Entry {model:string;label:string;score?:number;rating?:number;games?:number;ballots?:number;[key:string]:unknown}
export const STUDY_TERMS='Public StudyArena leaderboard page. Site terms apply. The almanac credits and links the source.';
export async function studyRows(kind:'text'|'image'|'audio'):Promise<LeaderboardRow[]>{
  const url='https://studyarena.com/leaderboard'+(kind==='text'?'':'/'+kind);
  const payload=nextFlight(await fetchText(url));
  const data=jsonAfter<Entry[]>(payload,'"rows":');
  let stats:Record<string,Record<string,unknown>>={};
  if(kind==='text'&&payload.includes('"stats":')) stats=jsonAfter(payload,'"stats":');
  const rows:LeaderboardRow[]=[];
  for(const r of data){
    const score=r.score??r.rating;
    if(!r.model||typeof score!=='number'||!Number.isFinite(score)||(r.ballots??r.games??0)<=0)continue;
    const metrics:Record<string,number>={};
    for(const [k,v] of Object.entries(r))if(typeof v==='number'&&Number.isFinite(v))metrics[k]=v;
    for(const [k,v] of Object.entries(stats[r.model]??{}))if(typeof v==='number'&&Number.isFinite(v))metrics[k]=v;
    // Timing and token statistics are medians from source telemetry, not mean per-task output tokens.
    const effort=r.label.match(/^(.*?)\s*\(([^()]*Reasoning)\)$/i);
    let model=effort?.[1]??r.label;
    if(/^(?:GPT[- ]?4o|Gemini 2\.5 (?:Pro|Flash))$/i.test(model))model+=' [snapshot unspecified]';
    rows.push({model,score,setting:effort?.[2].toLowerCase(),metrics});
  }
  if(!rows.length)throw new Error(`StudyArena ${kind} has no observed votes`);
  return rows;
}
