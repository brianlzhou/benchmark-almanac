// Public CompassArena summary endpoint, separate from OpenCompass benchmark aggregates.
// The endpoint currently exposes ten ranked models per pool, despite larger totalModels counts.
// The embedded Gradio full-table callbacks return errors. Do not invent missing ranks.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';
const API='https://rank.opencompass.org.cn/gw/opencompass-be/api/v1/rank/listArenaRankings';
interface Entry {model:string;eloRating:number;votes:number;rankingUB:number;rankingElo:number;eloCI95:string;rankingChanges:number}
interface Response {success:boolean;data:{totalModels:number;totalVotes:number;lastUpdate:string;rankBy:string;rankings:Entry[]}}
export function compassArena(multimodal=false):Leaderboard{
 return {benchmark:multimodal?'compassarena-multimodal':'compassarena',url:'https://rank.opencompass.org.cn/leaderboard-arena'+(multimodal?'-multimodal':''),feed:API,
  terms:'Public CompassArena ranking API. The site offers research use with limited safeguards. The almanac credits and links the source.',
  aliases:{'Qwen3.7 Max':'qwen3-7-max','GPT-4.1-20250414':'gpt-4-1','GPT-5-2025-08-07':'gpt-5','Claude 3.5 Sonnet 20241022':'claude-3-5-sonnet-october-2024'},
  async fetch():Promise<LeaderboardRow[]>{
   const response=await fetchJson<Response>(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rankingType:multimodal?1:0})});
   if(!response.success||!response.data?.rankings?.length)throw new Error('CompassArena ranking summary missing');
   const d=response.data,rows:LeaderboardRow[]=[];
   for(const r of d.rankings){
    if(!r.model||!Number.isFinite(r.eloRating))continue;
    const metrics:Record<string,number>={votes:r.votes,rank:r.rankingElo,rankUB:r.rankingUB,rankChange:r.rankingChanges,poolModels:d.totalModels,poolVotes:d.totalVotes};
    const ci=r.eloCI95?.match(/^\+(\d+(?:\.\d+)?)\/-([\d.]+)$/);
    if(ci){metrics.ciLow=r.eloRating-Number(ci[2]);metrics.ciHigh=r.eloRating+Number(ci[1]);}
    rows.push({model:r.model,score:r.eloRating,date:d.lastUpdate,metrics});
   }
   if(!rows.length)throw new Error('CompassArena numeric ratings missing');
   return rows;
  }};
}
