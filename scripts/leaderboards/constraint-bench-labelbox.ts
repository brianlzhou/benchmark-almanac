// Labelbox reports a difficulty-weighted score for constraint satisfaction. The project page embeds the displayed percentage and its underlying fraction.
import type { Leaderboard } from './types.ts';
import { labelboxData } from './echochain-labelbox.ts';

const feed = "https://labelbox.com/leaderboards/constraint-bench/";


const board: Leaderboard = {
  benchmark: "constraint-bench-labelbox",
  url: "https://labelbox.com/leaderboards/constraint-bench/",
  feed,
  terms: "Labelbox links its terms of service and provides no separate leaderboard license. https://docs.labelbox.com/page/terms-of-service The robots rules exclude CGI and PDF paths.",
  async fetch(){
    const data=await labelboxData(feed,'constraint-bench');
    if(data.overall.length<9) throw new Error('Missing constraint models');
    return data.overall.map((r:{label:string;model:string;elo:number})=>{
      const original=data.info.overall.find((v:{model:string})=>v.model===r.model);
      if(!r.label || !original || !Number.isFinite(r.elo) || Math.abs(r.elo-original.score*100)>0.001) throw new Error('Invalid weighted score');
      return {model:r.label,score:r.elo};
    });
  },
};
export default board;
