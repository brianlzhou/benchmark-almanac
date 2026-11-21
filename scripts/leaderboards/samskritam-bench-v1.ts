// Samskritam Bench v1 reports exact-match accuracy across 340 Sanskrit questions. The preview JSON gives overall accuracy and four task accuracies.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://www.samskritam.ai/data/bench-v1.json";
const tasks=['padapatha','parse','scan','generate'];

const board: Leaderboard = {
  benchmark: "samskritam-bench-v1",
  url: "https://www.samskritam.ai/bench#v1-results",
  feed,
  terms: "The repository licenses the public web data under CC BY 4.0. https://github.com/ssriramhere/samskritam/blob/main/LICENSE-DATA.md The host returns 404 for robots.txt.",
  parts:Object.fromEntries(tasks.map(k=>[k,k])),
  async fetch(){
    const d=await fetchJson<{benchmark:string;rows:{model:string;overall:number;tasks:Record<string,number>}[]}>(feed);
    if(d.benchmark!=='samskritam-bench v1' || d.rows.length<6) throw new Error('Missing v1 standings');
    return d.rows.map(r=>{
      if(!r.model || ![r.overall,...tasks.map(k=>r.tasks[k])].every(Number.isFinite)) throw new Error('Incomplete Sanskrit score');
      const [model,setting]=r.model.split(' (');
      return {model,setting:setting?.replace(/\)$/,''),score:r.overall*100,metrics:Object.fromEntries(tasks.map(k=>[k,100*r.tasks[k]]))};
    });
  },
};
export default board;
