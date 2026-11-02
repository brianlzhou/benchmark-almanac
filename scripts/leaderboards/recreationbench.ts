// RecreationBench (Qwen, RecreationWorld). recreation-bench.cc renders its leaderboard in the browser from
// data/leaderboard.json: per model the reasoning effort, the estimated cost per task and, over the five
// platforms, the programmatic score (prog), the VLM judge score (vlm) and their mean (average, 0 to 1). The
// page ranks by that average, which is the score here (times 100); effort is the setting and the estimated
// cost per task is kept. Only rows the file marks primary are read (the page's default view).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://recreation-bench.cc/data/leaderboard.json';

interface Model {
  name: string;
  primary?: boolean;
  effort?: string;
  estimated_cost_usd_per_task?: number;
  overall?: { average?: number | null };
}

const board: Leaderboard = {
  benchmark: 'recreationbench',
  url: 'https://recreation-bench.cc/#leaderboard',
  feed: `${FEED} (overall.average)`,
  terms: 'JSON file the recreation-bench.cc page loads; the site publishes no robots.txt and no terms, and the results come from the RecreationWorld paper repository.',
  aliases: {},
  async fetch() {
    const { models } = await fetchJson<{ models: Model[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const m of models) {
      const avg = m.overall?.average;
      if (!m.name || m.primary === false || typeof avg !== 'number') continue;
      rows.push({
        model: m.name.trim(),
        score: avg * 100,
        setting: m.effort && m.effort !== 'enabled' ? m.effort : undefined,
        cost: m.estimated_cost_usd_per_task,
      });
    }
    return rows;
  },
};
export default board;
