// Public EvalAI endpoints used by the KilometerVision challenge UI. Never retain contact metadata.
// The API stores fractional top-1 accuracy despite its schema describing percentages.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';
export function kilometerBoard(benchmark:string,split:number):Leaderboard {
 const feed=`https://eval.ai/api/jobs/challenge_phase_split/${split}/leaderboard/?page_size=1000&order_by=Top-1`;
 return {benchmark,url:'https://eval.ai/web/challenges/challenge-page/2707/leaderboard',feed,
  terms:'EvalAI publicly serves the challenge leaderboard. The Almanac credits EvalAI and the Perception Test organizers and links their board.',
  async fetch():Promise<LeaderboardRow[]>{
   let next:string|null=feed;const seen=new Set<string>();const rows:LeaderboardRow[]=[];
   while(next){
    if(seen.has(next)||!next.startsWith(`https://eval.ai/api/jobs/challenge_phase_split/${split}/leaderboard/`))throw new Error('Unexpected EvalAI pagination');
    seen.add(next);const d:{next:string|null;results:any[]}=await fetchJson<{next:string|null;results:any[]}>(next);
    for(const r of d.results){
     if(r.challenge_phase_split!==split||!r.submission__is_public)continue;
     const i=r.leaderboard__schema?.labels?.indexOf('Top-1');const score=r.result?.[i];
     if(!Number.isFinite(score))continue;if(score<0||score>1)throw new Error('KilometerVision fraction outside 0–1');
     const metadata=Array.isArray(r.submission__submission_metadata)?r.submission__submission_metadata:[];
     const named=metadata.find((m:any)=>m.name==='Model name')?.value;
     const mode=metadata.find((m:any)=>m.name==='evaluation_mode')?.value ?? (typeof r.submission__submission_metadata?.evaluation_mode==='string'?r.submission__submission_metadata.evaluation_mode:undefined);
     const team=r.submission__participant_team__team_name;
     const method=named||r.submission__method_name;
     rows.push({model:method?`${team} / ${method}`:team,score:score*100,harness:team,setting:[mode,`submission ${r.submission__id}`].filter(Boolean).join('; '),date:r.submission__submitted_at?.slice(0,10),metrics:{hostVerified:r.submission__is_verified_by_host?1:0,baseline:r.submission__is_baseline?1:0}});
    }
    next=d.next;if(next)await new Promise(r=>setTimeout(r,1100));
   }
   if(!rows.length)throw new Error('KilometerVision public results missing');return rows;
  }
 };
}
