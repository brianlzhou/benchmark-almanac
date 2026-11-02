// MyPCBench. mypcbench.com renders its leaderboard from data/leaderboard.json: per model the rubric score,
// the perfect rate (share of the 184 tasks completed perfectly, 0 to 100), steps and the agent interface.
// The board ranks by perfect rate, which is the score. Some rows are self-reported by their makers (the
// file marks them); they appear on the board and are kept, with the agent interface as the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://mypcbench.com/data/leaderboard.json';

interface Model {
  model: string;
  perfect_rate?: number;
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
      rows.push({ model: m.model.trim(), score: m.perfect_rate, harness: m.agent_interface || undefined });
    }
    return rows;
  },
};
export default board;
