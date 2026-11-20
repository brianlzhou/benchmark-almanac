// Published Score@1, including stopped runs as zero. Never recompute from rounded task rewards.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const url = 'https://acceleratebench.com/';
const feed = `${url}assets/results.json`;
interface Entry {name:string; harness:string; effort:string; score:number; ref:number; gm:number; a125:number; a2:number; steps:number|null; tokens:number|null; stopped_tasks:string[]}
export default {
  benchmark:'accelerate-bench', url, feed,
  terms:'The authors publish this downloadable results file; robots.txt has no restrictions and the project page states no separate extraction terms.',
  async fetch():Promise<LeaderboardRow[]> {
    const d=await fetchJson<{models:Entry[]}>(feed);
    const rows=d.models.map(r=>({model:r.name,harness:r.harness,setting:`${r.effort} effort; benchmark v1.1`,score:r.score,
      metrics:{referenceScore:r.ref,geometricMeanSpeedup:r.gm,accuracy125:r.a125,accuracy2:r.a2,stoppedTasks:r.stopped_tasks.length,...(r.steps==null?{}:{steps:r.steps}),...(r.tokens==null?{}:{reportedTokens:r.tokens})}}));
    if(rows.length<3 || rows.some(r=>!Number.isFinite(r.score)))throw new Error('Accelerate-Bench model scores missing');
    return rows;
  },
} satisfies Leaderboard;
