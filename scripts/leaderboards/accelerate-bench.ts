// Published Score@1, including stopped runs as zero. Keep each published task reward under its scientific area.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const url = 'https://acceleratebench.com/';
const feed = `${url}assets/results.json`;
interface Entry {name:string; harness:string; effort:string; score:number; ref:number; gm:number; a125:number; a2:number; steps:number|null; tokens:number|null; stopped_tasks:string[]}
interface Task {id: string; name: string; area: string; rewards_percent: (number | null)[]}
const board: Leaderboard = {
  benchmark:'accelerate-bench', url, feed,
  terms:'The authors publish this downloadable results file; robots.txt has no restrictions and the project page states no separate extraction terms.',
  async fetch():Promise<LeaderboardRow[]> {
    const d=await fetchJson<{models:Entry[]; tasks:Task[]}>(feed);
    const tasks = d.tasks.map(task => ({
      ...task,
      key: task.id.replace(/_cpu$/, '').replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase()),
    }))
    if (tasks.some(task => task.rewards_percent.length !== d.models.length)) throw new Error('Task reward columns changed')
    board.parts = Object.fromEntries(tasks.map(task => [task.key, {name: task.name, group: task.area}]))
    const rows=d.models.map((r, i)=>({model:r.name,harness:r.harness,setting:`${r.effort} effort; benchmark v1.1`,score:r.score,trials:1,
      metrics:{...Object.fromEntries(tasks.flatMap(task => typeof task.rewards_percent[i] === 'number' ? [[task.key, task.rewards_percent[i]]] : [])),referenceScore:r.ref,geometricMeanSpeedup:r.gm,accuracy125:r.a125,accuracy2:r.a2,stoppedTasks:r.stopped_tasks.length,...(r.steps==null?{}:{steps:r.steps}),...(r.tokens==null?{}:{reportedTokens:r.tokens})}}));
    if(rows.length<3 || rows.some(r=>!Number.isFinite(r.score)))throw new Error('Accelerate-Bench model scores missing');
    return rows;
  },
};
export default board;
