// Every's Senior Engineer Benchmark measures agents on a repository repair task.
// The headline is the percentage of the benchmark's 48 weighted checks passed.
// This importer reads Every's public JSON feed for the scoreboard.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://checks.every.to/p/senior-engineer-benchmark/feed';
interface Feed { runs: { model: string; agent?: string | null; effort?: string | null; date?: string; url?: string; avg: number }[] }
const board: Leaderboard = {
  benchmark: 'senior-engineer-benchmark-every-checks',
  url: 'https://checks.every.to/p/senior-engineer-benchmark',
  feed: FEED,
  terms: 'Every publishes this JSON feed for the public scoreboard. Results are credited to Every.',
  parts: { proofRewriteIntegrated: { name: 'Proof rewrite, integrated', group: 'Task', unit: '%' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<Feed>(FEED);
    if (!Array.isArray(data.runs) || data.runs.length < 8) throw new Error(`Every Checks: ${data.runs?.length ?? 0} runs, expected 8`);
    return data.runs.map((r) => ({
      model: r.model,
      score: r.avg,
      harness: r.agent ?? undefined,
      setting: r.effort ?? undefined,
      date: r.date,
      link: r.url,
      metrics: { proofRewriteIntegrated: r.avg },
    }));
  },
};
export default board;
