// Arena's Agent Arena, read through Arena's Hugging Face dataset: its "agent" subset, overall category, latest split.
// The helper lives in lmarena-elo.ts. The agent subset has columns the helper does not read, so this file reads
// the same rows again and adds them: the median cost per task (cost_per_task_p50, US dollars) as `cost`, the
// median output tokens per task (output_tokens_per_task_p50) as `tokens`, the score's 95% interval
// (score_ci_lower, score_ci_upper as metrics.ciLow, ciHigh) and the session count (metrics.sessions).
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
    // the two reads list the same rows in the same order; a row takes the extras only when its score matches
    return rows.map((r, i): LeaderboardRow => {
      const a = raw[i];
      if (!a || a.score !== r.score) return r;
      const metrics: Record<string, number> = { ...r.metrics };
      if (fin(a.score_ci_lower) && fin(a.score_ci_upper)) Object.assign(metrics, { ciLow: a.score_ci_lower, ciHigh: a.score_ci_upper });
      if (fin(a.session_count)) metrics.sessions = a.session_count;
      return {
        ...r,
        cost: fin(a.cost_per_task_p50) && a.cost_per_task_p50 > 0 ? a.cost_per_task_p50 : undefined,
        tokens: fin(a.output_tokens_per_task_p50) && a.output_tokens_per_task_p50 > 0 ? a.output_tokens_per_task_p50 : undefined,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      };
    });
  },
};
export default board;
