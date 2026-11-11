// Arena's Agent Arena, read through Arena's Hugging Face dataset: its "agent" subset, overall category, latest split.
// The helper lives in lmarena-elo.ts. The agent subset has columns the helper does not read, so this file reads
// the same rows again and adds them: median cost and output tokens stay in explicitly named metrics,
// because the shared cost and tokens fields mean averages. Also preserve the score's 95% interval
// (score_ci_lower, score_ci_upper as metrics.ciLow, ciHigh) and the session count (metrics.sessions).
// The dataset stores the score as a share (0.2014). Arena and the labs print it as a percentage (20.14%), so the
// score and its interval are multiplied by 100 here, and the record's unit is %.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRows } from './lmarena-elo.ts';

interface AgentRow {
  model_name: string;
  score?: number;
  score_ci_lower?: number | null;
  score_ci_upper?: number | null;
  session_count?: number | null;
  category: string;
  cost_per_task_p50?: number | null;
  output_tokens_per_task_p50?: number | null;
  observation_count?: number | null;
  leaderboard_publish_date?: string;
}

const fin = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

/** The agent subset's overall rows, in dataset order, filtered as arenaRows filters them. */
async function agentRows(): Promise<AgentRow[]> {
  const api = 'https://datasets-server.huggingface.co/rows?dataset=lmarena-ai%2Fleaderboard-dataset&config=agent&split=latest';
  const out: AgentRow[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await fetchJson<{ rows: { row: AgentRow }[]; num_rows_total: number }>(`${api}&offset=${offset}&length=100`);
    out.push(...page.rows.map((r) => r.row).filter((r) => r.category === 'overall' && r.model_name && fin(r.score)));
    if (!page.rows.length || offset + 100 >= page.num_rows_total) break;
  }
  return out;
}

const board: Leaderboard = {
  benchmark: 'agent-arena',
  url: 'https://arena.ai/leaderboard/agent',
  feed: arenaFeed('agent'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  async fetch() {
    const rows = await arenaRows('agent');
    const raw = await agentRows().catch(() => [] as AgentRow[]);
    const signals=new Map<string,Map<string,AgentRow>>();
    for(const name of ['bash_reliability','praise_complaint','steerability','task_outcome_explicit','tool_hallucination']){
      await new Promise(r=>setTimeout(r,2100));
      const url='https://datasets-server.huggingface.co/rows?dataset=lmarena-ai%2Fleaderboard-dataset&config=agent_'+name+'&split=latest&offset=0&length=100';
      const data=await fetchJson<{rows:{row:AgentRow}[];num_rows_total:number}>(url);
      if(data.num_rows_total>100)throw new Error('Agent signal needs pagination: '+name);
      signals.set(name,new Map(data.rows.map(r=>[r.row.model_name,r.row])));
    }
    // the two reads list the same rows in the same order; a row takes the extras only when its score matches
    const pct = (v: number) => Math.round(v * 1e6) / 1e4;
    return rows.map((r, i): LeaderboardRow => {
      const a = raw[i];
      const base = { ...r, score: pct(r.score) };
      if (!a || a.score !== r.score) return base;
      const metrics: Record<string, number> = { ...r.metrics };
      if (fin(a.score_ci_lower) && fin(a.score_ci_upper)) Object.assign(metrics, { ciLow: pct(a.score_ci_lower), ciHigh: pct(a.score_ci_upper) });
      if (fin(a.session_count)) metrics.sessions = a.session_count;
      if (fin(a.observation_count)) metrics.observations = a.observation_count;
      if (fin(a.cost_per_task_p50)) metrics.costPerTaskMedianUsd = a.cost_per_task_p50;
      if (fin(a.output_tokens_per_task_p50)) metrics.outputTokensPerTaskMedian = a.output_tokens_per_task_p50;
      for(const [name,table] of signals){
        const signal=table.get(a.model_name);
        // Never join a historical signal snapshot to a newer aggregate.
        if(!signal||signal.leaderboard_publish_date!==a.leaderboard_publish_date)continue;
        if(fin(signal.score))metrics[name]=pct(signal.score);
        if(fin(signal.score_ci_lower))metrics[name+'_ciLow']=pct(signal.score_ci_lower);
        if(fin(signal.score_ci_upper))metrics[name+'_ciHigh']=pct(signal.score_ci_upper);
        if(fin(signal.observation_count))metrics[name+'_observations']=signal.observation_count;
      }
      return {
        ...base,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      };
    });
  },
};
export default board;
