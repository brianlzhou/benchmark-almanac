// SWE-Serve evaluates coding agents on 53 software-service tasks with three complete runs per model setting.
// The headline score is Pass@1, the percentage of verifier attempts that pass, from NVIDIA's JSON feed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://research.nvidia.com/sites/default/files/benchmarks/swe-serve/leaderboard-data.json';
interface Config {
  model: string;
  effort?: string;
  pass_rate_pct: number;
  run_ci95_half_pp: number;
  resources?: { cost?: number; output_tokens?: number; wall_time?: number };
}
interface Data { configs: Config[] }

const board: Leaderboard = {
  benchmark: 'swe-serve',
  url: 'https://research.nvidia.com/benchmarks/swe-serve',
  feed: FEED,
  terms: 'NVIDIA publishes this leaderboard and its JSON feed on the public research page. https://research.nvidia.com/benchmarks/swe-serve',
  reference: ['mini-SWE-agent'],
  aliases: {
    'GLM-5.2 max': 'glm-5-2',
    'Kimi K3 max': 'kimi-k3',
  },
  async fetch() {
    const data = await fetchJson<Data>(FEED);
    if (!Array.isArray(data.configs) || data.configs.length < 11) throw new Error('SWE-Serve: missing configuration rows');
    return data.configs.map((c): LeaderboardRow => {
      if (!c.model || !Number.isFinite(c.pass_rate_pct) || !Number.isFinite(c.run_ci95_half_pp)) throw new Error('SWE-Serve: missing model or score');
      const resources = c.resources ?? {};
      return {
        model: c.model,
        setting: c.effort,
        score: c.pass_rate_pct,
        low: c.pass_rate_pct - c.run_ci95_half_pp,
        high: c.pass_rate_pct + c.run_ci95_half_pp,
        cost: resources.cost,
        tokens: resources.output_tokens,
        metrics: resources.wall_time === undefined ? undefined : { wallTime: resources.wall_time },
      };
    });
  },
};
export default board;
