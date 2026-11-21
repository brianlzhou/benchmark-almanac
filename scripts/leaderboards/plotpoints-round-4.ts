// Round 4 ranks models by Youden’s J for respecting hard limits and engaging with allowed requests. PlotPoints publishes the index and its component rates.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://plotlightstudios.com/api/plotpoints/leaderboard?round=4";
interface Run {name:string;ranked:boolean;J:number|null;[key:string]:unknown}

const board: Leaderboard = {
  benchmark: "plotpoints-round-4",
  url: "https://plotlightstudios.com/plotpoints/leaderboard",
  feed,
  terms: "PlotPoints labels its public results CC BY 4.0. The repository and Hugging Face dataset list CC BY-NC 4.0. https://plotlightstudios.com/plotpoints https://huggingface.co/datasets/lazyweasel/roleplay-bench The site disallows /api/ in robots.txt.",
  async fetch(){
    const d=await fetchJson<{round:number;board:{rows:Run[]}}>(feed);
    const ranked=d.board.rows.filter(r=>r.ranked);
    if(d.round!==4 || ranked.length<55) throw new Error('Incomplete Round 4 ranking');
    return ranked.map(r=>{
      if(!r.name || !Number.isFinite(r.J)) throw new Error('Missing ranked J');
      const metrics:Record<string,number>={};
      function collect(values:Record<string,unknown>,prefix=''){
        for(const [k,v] of Object.entries(values)){
          if(k==='J' || k==='rank') continue;
          if(typeof v==='number') metrics[prefix+k]=v;
          else if(v && typeof v==='object' && !Array.isArray(v)) collect(v as Record<string,unknown>,prefix+k+'_');
        }
      }
      collect(r);return {model:r.name,score:r.J!,metrics};
    });
  },
};
export default board;
