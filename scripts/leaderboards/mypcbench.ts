// MyPCBench. mypcbench.com renders its leaderboard from data/leaderboard.json: per model the rubric score,
// the perfect rate (share of the 184 tasks completed perfectly, 0 to 100), steps and the agent interface.
// The board ranks by perfect rate, which is the score. Some rows are self-reported by their makers (the
// file marks them). They appear on the board and are kept, with the agent interface as the harness. The other
// two metrics the board reports, the rubric score ("rubric", %) and trajectory efficiency ("trajEff"), and the
// source link, weight status and task counts are retained. The mean steps per task ("steps") go in `metrics`.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://mypcbench.com/data/leaderboard.json';

interface Model {
  model: string;
  weights?: string;
  vendor?: string;
  n?: number;
  perfect?: number;
  source_url?: string;
  max_steps?: number;
  self_reported?: boolean;
  protocol_note?: string;
  per_category?: Record<string, number>;
  perfect_rate?: number;
  rubric_score?: number | null;
  traj_eff?: number | null;
  avg_steps?: number | null;
  agent_interface?: string | null;
}

const board: Leaderboard = {
  benchmark: 'mypcbench',
  parts: {
    aggregation_reporting: { name: 'Aggregation reporting', group: 'Task type' },
    bounded_action: { name: 'Bounded action', group: 'Task type' },
    cross_source_reconciliation: { name: 'Cross source reconciliation', group: 'Task type' },
    multi_step_orchestration: { name: 'Multi step orchestration', group: 'Task type' },
    pattern_inference: { name: 'Pattern inference', group: 'Task type' },
    personal_lookup: { name: 'Personal lookup', group: 'Task type' },
  },
  url: 'https://mypcbench.com/',
  feed: `${FEED} (perfect_rate)`,
  terms: 'JSON file the mypcbench.com page loads; robots.txt allows all paths and the site states no terms.',
  aliases: {},
  async fetch() {
    const { models } = await fetchJson<{ models: Model[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const m of models) {
      if (!m.model || typeof m.perfect_rate !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const [k, v] of [['tasks', m.n], ['perfect', m.perfect], ['rubric', m.rubric_score], ['trajEff', m.traj_eff], ['steps', m.avg_steps]] as const) {
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      for (const [key, value] of Object.entries(m.per_category ?? {})) if (Number.isFinite(value)) metrics[key] = value;
      const setting = [m.max_steps && `${m.max_steps} steps`, m.protocol_note || (m.self_reported ? 'Self-reported' : undefined)].filter(Boolean).join('; ') || undefined;
      rows.push({ setting, open: m.weights === 'open' ? true : ['closed','unreleased'].includes(m.weights ?? '') ? false : undefined,
        link: m.self_reported ? m.source_url : undefined, submitter: m.self_reported ? m.vendor : undefined, model: m.model.trim(), score: m.perfect_rate, harness: m.agent_interface || undefined, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    return rows;
  },
};
export default board;
