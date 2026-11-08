// MyPCBench. mypcbench.com renders its leaderboard from data/leaderboard.json: per model the rubric score,
// the perfect rate (share of the 184 tasks completed perfectly, 0 to 100), steps and the agent interface.
// The board ranks by perfect rate, which is the score. Some rows are self-reported by their makers (the
// file marks them). They appear on the board and are kept, with the agent interface as the harness. The other
// two metrics the board reports, the rubric score ("rubric", %) and trajectory efficiency ("trajEff"), and the
// mean steps per task ("steps") go in `metrics`.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://mypcbench.com/data/leaderboard.json';

interface Model {
  model: string;
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
      for (const [k, v] of [['rubric', m.rubric_score], ['trajEff', m.traj_eff], ['steps', m.avg_steps]] as const) {
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      for (const [key, value] of Object.entries(m.per_category ?? {})) if (Number.isFinite(value)) metrics[key] = value;
      const setting = [m.max_steps && `${m.max_steps} steps`, m.protocol_note || (m.self_reported ? 'Self-reported' : undefined)].filter(Boolean).join('; ') || undefined;
      rows.push({ setting, model: m.model.trim(), score: m.perfect_rate, harness: m.agent_interface || undefined, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    return rows;
  },
};
export default board;
