// Handoff ranks systems by takeoff accuracy on residential drawings. Its SVG chart prints each model label and percentage at the same height.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/handoffai/residential-takeoff-benchmark/main/docs/images/leaderboard.svg";


const board: Leaderboard = {
  benchmark: "takeoffbench-v1",
  url: "https://www.handoff.ai/tech/h1-model-release",
  feed,
  terms: "Handoff reserves rights to the technical report. The repository lists no score reuse license. https://www.handoff.ai/tech/h1-model-release Handoff allows crawling. The raw file host returns 404 for robots.txt.",
  notModels: /^human-estimator$/i,
  async fetch(){
    const svg=await fetchText(feed);const labels=new Map<string,string>();const scores=new Map<string,number>();
    for(const m of svg.matchAll(/<text\b([^>]*\bdominant-baseline="central"[^>]*)>([^<]+)<\/text>/g)){
      const y=m[1].match(/\by="([^"]+)"/)?.[1];
      if(!y) throw new Error('Missing chart coordinate');
      if(m[2].endsWith('%')) scores.set(y,Number(m[2].slice(0,-1)));
      else labels.set(y,m[2]);
    }
    const rows:LeaderboardRow[]=[];
    for(const [y,model] of labels){
      const score=scores.get(y);if(score===undefined || !Number.isFinite(score)) throw new Error('Missing accuracy for '+model);
      rows.push({model,score});
    }
    if(rows.length<8) throw new Error('Incomplete takeoff chart');
    return rows;
  },
};
export default board;
