// Arena's Agent Arena, read through Arena's Hugging Face dataset: its "agent" subset, overall category, latest split.
// The helper lives in lmarena-elo.ts. The agent subset has columns the helper does not read, so this file takes
// the same rows from arenaSubset and adds them: median cost and output tokens stay in explicitly named metrics,
// because the shared cost and tokens fields mean averages. Also preserve the score's 95% interval
// (score_ci_lower, score_ci_upper as metrics.ciLow, ciHigh) and the session count (metrics.sessions).
// The dataset stores the score as a share (0.2014). Arena and the labs print it as a percentage (20.14%), so the
// score and its interval are multiplied by 100 here, and the record's unit is %.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRows, arenaSubset } from './lmarena-elo.ts';

interface AgentRow {
  model_name: string;
  score?: number;
  score_ci_lower?: number | null;
  score_ci_upper?: number | null;
  session_count?: number | null;
  category: string;
  cost_per_task_p50?: number | null;
  output_tokens_per_task_p50?: number | null;
  rank?: number;
  observation_count?: number | null;
  leaderboard_publish_date?: string;
}

const fin = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

/** The agent subset's overall rows, in the file's order, filtered as arenaRows filters them. */
async function agentRows(): Promise<AgentRow[]> {
  return (await arenaSubset<AgentRow>('agent')).filter((r) => r.category === 'overall' && r.model_name && fin(r.score));
}

const board: Leaderboard = {
  benchmark: 'agent-arena',
  parts: {
    bash_reliability: { name: 'Bash reliability', group: 'Dimension' },
    praise_complaint: { name: 'Praise and complaint', group: 'Dimension' },
    steerability: { name: 'Steerability', group: 'Dimension' },
    task_outcome_explicit: { name: 'Explicit task outcome', group: 'Dimension' },
    tool_hallucination: { name: 'Tool hallucination', group: 'Dimension' },
  },
  url: 'https://arena.ai/leaderboard/agent',
  feed: arenaFeed('agent'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  stats: {
    sessions: { name: 'Sessions', unit: 'count' },
    observations: { name: 'Observations', unit: 'count' },
    outputTokensPerTaskMedian: { name: 'Median output tokens per task', unit: 'tokens' },
    bash_reliability_observations: { name: 'Bash reliability observations', unit: 'count' },
    bash_reliability_sessions: { name: 'Bash reliability sessions', unit: 'count' },
    praise_complaint_observations: { name: 'Praise and complaint observations', unit: 'count' },
    praise_complaint_sessions: { name: 'Praise and complaint sessions', unit: 'count' },
    steerability_observations: { name: 'Steerability observations', unit: 'count' },
    steerability_sessions: { name: 'Steerability sessions', unit: 'count' },
    task_outcome_explicit_observations: { name: 'Explicit task outcome observations', unit: 'count' },
    task_outcome_explicit_sessions: { name: 'Explicit task outcome sessions', unit: 'count' },
    tool_hallucination_observations: { name: 'Tool hallucination observations', unit: 'count' },
    tool_hallucination_sessions: { name: 'Tool hallucination sessions', unit: 'count' },
  },
  // Arena's own Pareto view plots the score against cost per task, with the median (p50) as its default cost
  chart: {
    title: 'Score against cost per task',
    x: { key: 'costPerTaskMedianUsd', label: 'Median cost per task', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Agent Arena score', unit: '%', better: 'higher' },
    note: 'Each cost is the median cost of one task in Agent Mode sessions, as Arena reports it.',
  },
  async fetch() {
    const rows = await arenaRows('agent');
    const raw = await agentRows().catch(() => [] as AgentRow[]);
    const signals=new Map<string,Map<string,AgentRow>>();
    for(const name of ['bash_reliability','praise_complaint','steerability','task_outcome_explicit','tool_hallucination']){
      const data=await arenaSubset<AgentRow>('agent_'+name);
      signals.set(name,new Map(data.map(r=>[r.model_name,r])));
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
        if (fin(signal.session_count)) metrics[name + '_sessions'] = signal.session_count;
        if(fin(signal.observation_count))metrics[name+'_observations']=signal.observation_count;
      }
      return {
        ...base, low: metrics.ciLow, high: metrics.ciHigh,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      };
    });
  },
};
export default board;
