// The official nuScenes object-detection board ranks test-set submissions by NDS.
// Keep its raw 0–1 NDS scale and its mAP/error metrics, separately from the catalog's inferred grounding setup.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const feed='https://www.nuscenes.org/detection.json';
const board:Leaderboard={benchmark:'nuscenes-detection',url:'https://www.nuscenes.org/object-detection',feed,
 terms:'Motional publishes these leaderboard submissions on nuScenes. The Almanac credits and links the original board; dataset terms remain separate.',
 async fetch():Promise<LeaderboardRow[]>{
  const data=await fetchJson<any[]>(feed);const rows:LeaderboardRow[]=[];
  for(const d of data){
   const meta=d.meta?.submit_meta;const result=d.result?.[0]?.test_split;
   if(!meta?.method_name||!Number.isFinite(result?.NDS))continue;
   const metrics:Record<string,number>={};for(const [k,v] of Object.entries(result)){if(typeof v==='number'&&Number.isFinite(v))metrics[k]=v;}
   const modes=['camera','lidar','radar','map','external'].filter(k=>d.meta[`use_${k}`]);
   rows.push({model:meta.method_name,score:result.NDS,setting:`${modes.join(', ')}; submission ${meta.submission_id??meta.submitted_at}`,harness:meta.participant_team_name,date:/^\d{4}-\d{2}-\d{2}/.test(meta.submitted_at)?meta.submitted_at.slice(0,10):undefined,metrics});
  }if(!rows.length)throw new Error('nuScenes detection results missing');return rows;
 }
};export default board;
