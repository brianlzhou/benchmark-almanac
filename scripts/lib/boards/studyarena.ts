// StudyArena's Next.js payload publishes separate text, image and audio rankings.
// Keep the model directory link, published token rates, and timing percentiles in seconds.
import type { BoardStat, LeaderboardRow} from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { nextFlight, jsonAfter } from '../html.ts';
interface Entry {model:string;label:string;score?:number;rating?:number;games?:number;ballots?:number;[key:string]:unknown}
export const STUDY_TERMS='Public StudyArena leaderboard page. Site terms apply. The almanac credits and links the source.';
export const STUDY_STATS: Record<string, BoardStat> ={rating:{name:'Elo rating',unit:'rating',better:'higher'},games:{name:'Games played',unit:'count'},wins:{name:'Wins',unit:'count'},losses:{name:'Losses',unit:'count'},ties:{name:'Ties',unit:'count'},winRate:{name:'Win rate',unit:'score',better:'higher',note:'Stored from 0 to 1.'},delta7d:{name:'Seven-day rating change',unit:'rating'},delta30d:{name:'Thirty-day rating change',unit:'rating'},percentile:{name:'Percentile',unit:'score',better:'higher',note:'Stored from 0 to 1.'}};
export const STUDY_TEXT_STATS: Record<string, BoardStat> ={wins:STUDY_STATS.wins,losses:STUDY_STATS.losses,ties:STUDY_STATS.ties,winRate:STUDY_STATS.winRate,delta7d:STUDY_STATS.delta7d,delta30d:STUDY_STATS.delta30d,score:{name:'Elo score',unit:'rating',better:'higher'},ballots:{name:'Ballots',unit:'count'},allBad:{name:'All-bad outcomes',unit:'count'},answers:{name:'Answers',unit:'count'},timed:{name:'Timed responses',unit:'count'},medianDurationMs:{name:'Median response duration',unit:'ms',better:'lower'},p25DurationMs:{name:'25th percentile response duration',unit:'ms',better:'lower'},p75DurationMs:{name:'75th percentile response duration',unit:'ms',better:'lower'},medianFirstEventMs:{name:'Median first-event time',unit:'ms',better:'lower'},medianAnswerChars:{name:'Median answer characters',unit:'count'},medianOutputTokens:{name:'Median output tokens',unit:'tokens'},completionRate:{name:'Completion rate',unit:'score',better:'higher',note:'Stored from 0 to 1.'},flagRate:{name:'Flag rate',unit:'score',better:'lower',note:'Stored from 0 to 1.'}};
export async function studyRows(kind:'text'|'image'|'audio'):Promise<LeaderboardRow[]>{
  const url='https://studyarena.com/leaderboard'+(kind==='text'?'':'/'+kind);
  const payload=nextFlight(await fetchText(url));
  const data=jsonAfter<Entry[]>(payload,'"rows":');
  let stats:Record<string,Record<string,unknown>>={};
  if(kind==='text'&&payload.includes('"stats":')) stats=jsonAfter(payload,'"stats":');
  const links = payload.includes('"directoryLinksByModel":')
    ? jsonAfter<Record<string, { modelSlug?: string }>>(payload, '"directoryLinksByModel":') : {};
  const prices = payload.includes('"prices":')
    ? jsonAfter<Record<string, { inputUsdPerMillion?: number; outputUsdPerMillion?: number }>>(payload, '"prices":') : {};
  const rows:LeaderboardRow[]=[];
  for(const r of data){
    const score=r.score??r.rating;
    if(!r.model||typeof score!=='number'||!Number.isFinite(score)||(r.ballots??r.games??0)<=0)continue;
    const metrics:Record<string,number>={};
    for(const [k,v] of Object.entries(r))if(k!=='rank'&&typeof v==='number'&&Number.isFinite(v))metrics[k]=v;
    for(const [k,v] of Object.entries(stats[r.model]??{}))if(typeof v==='number'&&Number.isFinite(v))metrics[k]=v;
    for (const [key, value] of Object.entries(prices[r.model] ?? {})) {
      if (typeof value === 'number' && Number.isFinite(value)) metrics[key === 'inputUsdPerMillion' ? 'priceIn' : key === 'outputUsdPerMillion' ? 'priceOut' : key] = value;
    }
    for (const key of ['medianDuration', 'p25Duration', 'p75Duration', 'medianFirstEvent']) {
      if (typeof metrics[key + 'Ms'] === 'number') metrics[key + 'Seconds'] = metrics[key + 'Ms'] / 1000;
    }
    const slug = links[r.model]?.modelSlug;
    // Timing and token statistics are medians from source telemetry, not mean per-task output tokens.
    const effort=r.label.match(/^(.*?)\s*\(([^()]*Reasoning)\)$/i);
    let model=effort?.[1]??r.label;
    if(/^(?:GPT[- ]?4o|Gemini 2\.5 (?:Pro|Flash))$/i.test(model))model+=' [snapshot unspecified]';
    rows.push({model,score,link:slug ? `https://studyarena.com/models/${encodeURIComponent(slug)}` : undefined,setting:effort?.[2].toLowerCase(),metrics});
  }
  if(!rows.length)throw new Error(`StudyArena ${kind} has no observed votes`);
  return rows;
}
