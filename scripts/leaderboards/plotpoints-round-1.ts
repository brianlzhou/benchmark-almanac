// PlotPoints Round 1 ranks single-turn roleplay replies by blind-vote Elo. The public leaderboard API includes intervals and vote counts.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://plotlightstudios.com/api/plotpoints/leaderboard?round=1&test=elo";
interface Model {name:string;elo?:number;eloPm:number;arenaVotes:number;sfw:number;nsfw:number;access:string;latencyMs?:number}

const board: Leaderboard = {
  benchmark: "plotpoints-round-1",
  url: "https://plotlightstudios.com/plotpoints/leaderboard?round=1&test=elo",
  feed,
  terms: "PlotPoints labels its public results CC BY 4.0. The repository and Hugging Face dataset list CC BY-NC 4.0. https://plotlightstudios.com/plotpoints https://huggingface.co/datasets/lazyweasel/roleplay-bench The site disallows /api/ in robots.txt.",
  stats: { votes: { name: 'Votes', unit: 'count' }, sfw: { name: 'SFW votes', unit: 'count' }, nsfw: { name: 'NSFW votes', unit: 'count' }, latency: { name: 'Latency', unit: 'ms', better: 'lower' } },
  async fetch(){
    const d=await fetchJson<{test:string;models:Model[]}>(feed);
    const ranked=d.models.filter(r=>typeof r.elo==='number');
    if(d.test!=='elo' || ranked.length<11) throw new Error('Missing single-turn Elo standings');
    return ranked.map(r=>{
      if(!r.name || ![r.elo,r.eloPm,r.arenaVotes].every(Number.isFinite)) throw new Error('Invalid arena result');
      return {model:r.name,score:r.elo!,low:r.elo!-r.eloPm,high:r.elo!+r.eloPm,open:r.access==='open',
        metrics:{votes:r.arenaVotes,sfw:r.sfw,nsfw:r.nsfw,...(Number.isFinite(r.latencyMs) ? {latency:r.latencyMs} : {})}};
    });
  },
};
export default board;
