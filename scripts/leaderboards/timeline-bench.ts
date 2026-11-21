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
  stats: { resolved:{name:'Resolved tasks',unit:'count'}, tasks:{name:'Tasks',unit:'count'}, rate:{name:'Resolution rate',unit:'score',better:'higher',note:'Rate from 0 to 1.'}, tests_passed:{name:'Tests passed',unit:'count'}, videos_delivered:{name:'Videos delivered',unit:'count'}, missing_outputs:{name:'Missing outputs',unit:'count'}, delivery_pass:{name:'Delivery passes',unit:'count'}, gate_pass:{name:'Gate passes',unit:'count'}, brief_must_pass:{name:'Brief must pass',unit:'count'}, brief_must_pass_strict_rule:{name:'Brief must pass under strict rule',unit:'count'}, quality_bar_with_gate_56:{name:'Quality bar with gate',unit:'score',better:'higher',note:'Rate from 0 to 1.'}, resolved_frozen_margins:{name:'Resolved with frozen margins',unit:'count'}, editor_win_or_tie:{name:'Editor win or tie rate',unit:'score',better:'higher',note:'Rate from 0 to 1.'}, editor_assessable_votes:{name:'Editor assessable votes',unit:'count'}, median_runtime_min:{name:'Median runtime',unit:'minutes',better:'lower'}, total_runtime_h:{name:'Total runtime',unit:'hours',better:'lower'}, tokens_input_tokens:{name:'Input tokens',unit:'tokens'}, tokens_cached_input_tokens:{name:'Cached input tokens',unit:'tokens'}, tokens_cache_write_input_tokens:{name:'Cache write input tokens',unit:'tokens'}, tokens_output_tokens:{name:'Output tokens',unit:'tokens'}, tokens_reasoning_output_tokens:{name:'Reasoning output tokens',unit:'tokens'}, cost_usd_total:{name:'Total cost',unit:'usd',better:'lower'}, cost_usd_median:{name:'Median cost',unit:'usd',better:'lower'} },
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
