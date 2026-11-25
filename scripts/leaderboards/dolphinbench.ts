// DolphinBench evaluates memory systems on 600 future task-completion requests across three simulated users.
// The headline score is the action pass rate as a percentage, with cost and median latency kept as metrics.
// This importer reads the official results JSON published by DolphinBench.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://dolphinbench.ai/leaderboard/';
const FEED = 'https://dolphinbench.ai/leaderboard/results.json';
interface PersonaScore {
  total: number;
  passes: number;
}
interface Config {
  harness: { name: string };
  model: { name: string; id: string };
  memory: { name: string };
  personas?: Record<string, PersonaScore>;
  pass_rate: number;
  passes?: number;
  total?: number;
  total_cost_usd: number;
  total_cost_usd_test_calls?: number;
  median_latency_seconds: number;
  p95_latency_seconds?: number;
  runs_url?: string;
}
const board: Leaderboard = {
  costPer: 'run',
  parts: {
    morgan: { name: 'Morgan', group: 'Persona' },
    alex: { name: 'Alex', group: 'Persona' },
    riley: { name: 'Riley', group: 'Persona' },
  },
  stats: {
    latency: { name: 'Median latency', unit: 'seconds', better: 'lower' },
    p95Latency: { name: '95th percentile latency', unit: 'seconds', better: 'lower' },
    testCallsCost: { name: 'Test calls cost', unit: 'usd', better: 'lower', note: 'Token-priced agent inference cost for test calls, excluding ingestion and grading.' },
    passes: { name: 'Passed tasks', unit: 'count', better: 'higher' },
    totalTasks: { name: 'Total tasks', unit: 'count' },
  },
  benchmark: 'dolphinbench',
  url: PAGE,
  feed: FEED,
  terms: 'DolphinBench publishes the official results JSON under its public benchmark terms. Results are credited to Mem0 and the DolphinBench authors.',
  aliases: {
    'gpt-5.6-luna-high': 'gpt-5-6-luna',
    'minimax-m3-high': 'minimax-m3',
  },
  async fetch() {
    const data = await fetchJson<{ schema_version?: number; configurations?: Config[] }>(FEED);
    if (data.schema_version !== 2 || !Array.isArray(data.configurations) || data.configurations.length < 10) throw new Error('DolphinBench: unexpected results schema');
    return data.configurations.map((c) => {
      if (!c.model?.name || !c.harness?.name || !c.memory?.name || typeof c.pass_rate !== 'number') throw new Error('DolphinBench: configuration missing required fields');
      const metrics: Record<string, number> = { latency: c.median_latency_seconds };
      if (typeof c.p95_latency_seconds === 'number' && Number.isFinite(c.p95_latency_seconds)) metrics.p95Latency = c.p95_latency_seconds;
      if (typeof c.total_cost_usd_test_calls === 'number' && Number.isFinite(c.total_cost_usd_test_calls)) metrics.testCallsCost = c.total_cost_usd_test_calls;
      if (typeof c.passes === 'number' && Number.isFinite(c.passes)) metrics.passes = c.passes;
      if (typeof c.total === 'number' && Number.isFinite(c.total)) metrics.totalTasks = c.total;
      for (const persona of ['morgan', 'alex', 'riley']) {
        const p = c.personas?.[persona];
        if (p && p.total > 0 && Number.isFinite(p.passes)) metrics[persona] = Math.round((p.passes / p.total) * 1000) / 10;
      }
      return {
        model: c.model.name,
        harness: `${c.harness.name}, ${c.memory.name}`,
        score: Math.round(c.pass_rate * 1000) / 10,
        cost: c.total_cost_usd,
        metrics,
        link: c.runs_url,
      };
    });
  },
};
export default board;
