// HWE-Bench v1.0 ranks RTL bug-repair agents by the percentage of 417 tasks resolved.
// Read the versioned score file and use each repository's own case count for its percentage.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const feed = "https://pku-liang.github.io/hwe-bench/scores-v1.0.json";
const board: Leaderboard = {
  benchmark: 'hwe-bench-rtl-repair',
  url: "https://pku-liang.github.io/hwe-bench/?version=v1.0",
  feed,
  terms: "The host returns HTML for robots.txt. The authors publish HWE-Bench under Apache 2.0.",
  costPer: 'run',
  async fetch() {
    const { benchmark, models } = await fetchJson<{ benchmark: { total: number; repos: { id: string; name: string; cases: number }[] };
      models: { name: string; agent: string; effort?: string; group: string; resolved: Record<string, number>; overall: number; costs: number; precision: number }[] }>(feed);
    if (benchmark.total !== 417 || models.length < 15 || benchmark.repos.length !== 6) throw new Error('Incomplete v1.0 benchmark');
    board.parts = Object.fromEntries(benchmark.repos.map(r => [r.id, r.name]));
    return models.map(m => {
      if (!m.name || !Number.isFinite(m.overall) || !benchmark.repos.every(r => Number.isFinite(m.resolved[r.id]) && r.cases > 0))
        throw new Error('Invalid RTL repair result');
      const metrics = Object.fromEntries(benchmark.repos.map(r => [r.id, 100 * m.resolved[r.id] / r.cases]));
      return { model: m.name, setting: m.effort, harness: m.agent, open: m.group === 'open-source', score: 100 * m.overall / benchmark.total,
        cost: m.costs, metrics: { ...metrics, precision: m.precision } };
    });
  },
};
export default board;
