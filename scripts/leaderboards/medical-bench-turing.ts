// Turing Medical Bench asks agents to assess longitudinal dermatology charts and
// write a clinical plan. This importer reads the page's public JSON leaderboard,
// preserving reasoning settings, cost, latency and tool-call counts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://bench.turing.com/medical/';
const FEED = 'https://bench.turing.com/medical/data.json';
interface Entry { display_name?: string; reasoning_effort?: string; score?: number; avg_cost?: number; avg_latency_min?: number; avg_tool_calls?: number }
const board: Leaderboard = {
  benchmark: 'medical-bench-turing', url: PAGE, feed: FEED,
  terms: 'Turing publishes this clinical benchmark leaderboard on its public page. Separate score reuse terms are not stated.',
  async fetch() {
    const data = await fetchJson<{ leaderboard?: Entry[] }>(FEED);
    const rows: LeaderboardRow[] = (data.leaderboard ?? []).flatMap((entry) => {
      if (!entry.display_name || typeof entry.score !== 'number') return [];
      const metrics: Record<string, number> = {};
      if (typeof entry.avg_latency_min === 'number') metrics.latency = entry.avg_latency_min * 60;
      if (typeof entry.avg_tool_calls === 'number') metrics.toolCalls = entry.avg_tool_calls;
      return [{ model: entry.display_name, setting: entry.reasoning_effort, score: entry.score, cost: entry.avg_cost, metrics }];
    });
    if (rows.length < 8) throw new Error(`Medical Bench: ${rows.length} rows, expected at least 8`);
    return rows;
  },
};
export default board;
