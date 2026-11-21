// VeruSAGE-Bench tests agents that synthesize Verus proofs for 849 repository-level Rust tasks.
// The headline is the official percentage of tasks solved, with average time, cost and project breakdowns retained.
// This importer reads the JSON file loaded by the official leaderboard page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://microsoft.github.io/verus-proof-synthesis/data/verusage-bench-results.json';
interface Data {
  total_tasks: number;
  projects: { code: string; name: string; tasks: number }[];
  submissions: {
    system_name: string; model: string; date?: string; verified?: boolean; paper_url?: string; code_url?: string;
    results: { solved: number; total: number; percent_solved: number; avg_time_minutes?: number; avg_cost_usd?: number };
    breakdown?: { category: string; solved: number; total: number }[];
  }[];
}
const board: Leaderboard = {
  stats: { solved: { name: 'Solved tasks', unit: 'count' }, total: { name: 'Total tasks', unit: 'count' }, latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, AL: { name: 'Alignment', unit: '%', better: 'higher' }, AC: { name: 'Accuracy', unit: '%', better: 'higher' }, IR: { name: 'Instruction following', unit: '%', better: 'higher' }, MA: { name: 'Memory accuracy', unit: '%', better: 'higher' }, NO: { name: 'No-op handling', unit: '%', better: 'higher' }, NR: { name: 'Noise robustness', unit: '%', better: 'higher' }, OS: { name: 'Outcome success', unit: '%', better: 'higher' }, ST: { name: 'State tracking', unit: '%', better: 'higher' }, VE: { name: 'Verification', unit: '%', better: 'higher' } },
  benchmark: 'verusage-bench',
  url: 'https://microsoft.github.io/verus-proof-synthesis/',
  feed: FEED,
  terms: 'The Microsoft Research leaderboard page publishes this JSON file. Results are credited to Microsoft Research and collaborators.',
  harnesses: 'system',
  parts: {},
  async fetch() {
    const data = await fetchJson<Data>(FEED);
    if (data.total_tasks !== 849 || data.submissions.length !== 10) throw new Error(`VeruSAGE-Bench: expected 849 tasks and 10 submissions`);
    for (const project of data.projects) board.parts![project.code] = { name: project.name, group: 'Project', unit: '%' };
    return data.submissions.map((submission) => {
      const metrics: Record<string, number> = { solved: submission.results.solved, total: submission.results.total };
      if (submission.results.avg_time_minutes !== undefined) metrics.latency = submission.results.avg_time_minutes * 60;
      for (const item of submission.breakdown ?? []) metrics[item.category] = item.solved / item.total * 100;
      return {
        model: submission.model,
        score: submission.results.percent_solved,
        harness: submission.system_name,
        setting: submission.system_name.replace(/^VeruSAGE \((.+)\)$/, '$1') || undefined,
        date: submission.date,
        verified: submission.verified,
        link: submission.paper_url ?? submission.code_url,
        cost: submission.results.avg_cost_usd,
        metrics,
      };
    });
  },
};
export default board;
