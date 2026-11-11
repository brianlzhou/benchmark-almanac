// The official All-votes leaderboard publishes an aggregate across rendering and topology votes.
// Retain both task-specific ratings as metrics. Never compute a maximum across the two tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const API='https://3d-arena-3d-arena.hf.space/api/leaderboard';
interface Entry {name:string;score:number|null;votes:number;open_source:boolean}
const board:Leaderboard={
  benchmark:'3d-arena',url:'https://huggingface.co/spaces/3d-arena/3d-arena',feed:API+'?vote_type=all',
  terms:'Public 3D Arena API. The Space repository is MIT-licensed. The almanac credits and links the source.',
  async fetch():Promise<LeaderboardRow[]>{
    const all=await fetchJson<Entry[]>(API+'?vote_type=all');
    const slices:Record<string,Map<string,Entry>>={};
    for(const kind of ['render','topology']){
      await new Promise(r=>setTimeout(r,2100));
      slices[kind]=new Map((await fetchJson<Entry[]>(API+'?vote_type='+kind)).map(r=>[r.name,r]));
    }
    const rows:LeaderboardRow[]=[];
    for(const r of all){
      if(!r.name||typeof r.score!=='number'||!Number.isFinite(r.score))continue;
      const metrics:Record<string,number>={votes:r.votes,openSource:Number(r.open_source)};
      for(const kind of ['render','topology']){
        const s=slices[kind].get(r.name);
        if(s&&typeof s.score==='number') {metrics[kind+'Rating']=s.score;metrics[kind+'Votes']=s.votes;}
      }
      rows.push({model:r.name,score:r.score,metrics});
    }
    if(!rows.length)throw new Error('3D Arena aggregate ratings missing');
    return rows;
  },
};
export default board;
