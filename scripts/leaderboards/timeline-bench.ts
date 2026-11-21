// TimelineBench ranks video-editing setups by task resolution rate. Its manifest links submissions with exact intervals, costs and verifier counts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://timelinebench.tensortest.com/code/files/leaderboard/leaderboard.json";

const board: Leaderboard = {
  benchmark: "timeline-bench",
  url: "https://timelinebench.tensortest.com/leaderboard",
  feed,
  terms: "TensorTest licenses results under Apache 2.0. The manifest links 19 submissions. Some submissions report cost and others leave it blank. https://timelinebench.tensortest.com/docs/license robots.txt disallows /code.",
  costPer: 'run', verified: 'verified by TimelineBench maintainers',
  async fetch() {
    type Run = {id:string, verified:boolean, evaluation:{attempts_per_task:number}, verification?:{by?:string},
      metadata:{model:string,harness:string,guidance:string,reasoning_effort?:string,dates_run?:string[]},
      metrics:Record<string,unknown> & {rate:number,ci95:[number,number],cost_usd_total?:number}};
    const manifest = await fetchJson<{entries:string[]}>(feed);
    if (manifest.entries.length < 19 || new Set(manifest.entries).size !== manifest.entries.length) throw new Error('Invalid submission manifest');
    const rows: LeaderboardRow[] = [];
    for (const id of manifest.entries) {
      await new Promise(resolve => setTimeout(resolve,1000));
      const link = new URL('submissions/' + encodeURIComponent(id) + '.json', feed).href;
      const r = await fetchJson<Run>(link), m = r.metrics, meta = r.metadata;
      if (r.id !== id || !meta.model || !meta.harness || ![m.rate,...m.ci95].every(Number.isFinite) || m.ci95.length !== 2) throw new Error('Invalid submission ' + id);
      const metrics: Record<string,number> = {};
      for (const [k,v] of Object.entries(m)) if (k !== 'rank' && typeof v === 'number') metrics[k] = v;
      if (typeof m.tokens === 'object' && m.tokens) for (const [k,v] of Object.entries(m.tokens)) if (typeof v === 'number') metrics['tokens_' + k] = v;
      rows.push({model:meta.model, harness:meta.harness, setting:['guidance ' + meta.guidance, meta.reasoning_effort].filter(Boolean).join(', '),
        score:m.rate*100, low:m.ci95[0]*100, high:m.ci95[1]*100, link, verified:r.verified,
        cost:m.cost_usd_total ?? undefined, trials:r.evaluation.attempts_per_task, date:meta.dates_run?.at(-1), metrics});
    }
    return rows;
  },
};

export default board;
