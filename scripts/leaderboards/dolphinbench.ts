// DolphinBench evaluates memory systems on 600 future task-completion requests across three simulated users.
// The headline score is the action pass rate as a percentage, with cost and median latency kept as metrics.
// This importer reads the official results JSON published by DolphinBench.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://dolphinbench.ai/leaderboard/';
const FEED = 'https://dolphinbench.ai/leaderboard/results.json';
interface Config {
  harness: { name: string };
  model: { name: string; id: string };
  memory: { name: string };
  pass_rate: number;
  total_cost_usd: number;
  median_latency_seconds: number;
  runs_url?: string;
}
const board: Leaderboard = {
  stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
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
      return {
        model: c.model.name,
        harness: `${c.harness.name}, ${c.memory.name}`,
        score: Math.round(c.pass_rate * 1000) / 10,
        cost: c.total_cost_usd,
        metrics: { latency: c.median_latency_seconds },
        link: c.runs_url,
      };
    });
  },
};
export default board;
