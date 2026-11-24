// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// UAV Operator evaluates simulated flight decisions. The Day 6 calibration JSON gives mean reward per tier.
import { execFileSync } from 'node:child_process';
import type { Leaderboard } from './types.ts';
import { fetchBytes, fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://api.primeintellect.ai/api/v1/environmentshub/jarrett/uav-operator/@latest';
const tiers = ['T0', 'T1', 'T2', 'T3'];
interface Tier {
  mean_reward: number, ci95_low: number, ci95_high: number, n: number, missions_completed: number,
  hard_safety_violations: number, mean_turns: number, max_turn_outcomes: number, provider_errors: number,
}
const board: Leaderboard = {
  benchmark: 'uav-operator', feed, url: 'https://app.primeintellect.ai/dashboard/environments/jarrett/uav-operator',
  terms: 'Prime Intellect publishes the calibration under its platform terms. https://www.primeintellect.ai/terms-of-service',
  headline: 'The calibration reports no overall score, so this is the plain mean of four tier rewards on the development split.',
  parts: Object.fromEntries(tiers.map(t => [t,t])),
  stats: { episodes: { name: 'Evaluated episodes', unit: 'count' }, missions: { name: 'Completed missions', unit: 'count' },
    violations: { name: 'Hard safety violations', unit: 'count', better: 'lower' }, steps: { name: 'Mean turns', unit: 'count' },
    capped: { name: 'Episodes reaching the turn limit', unit: 'count' }, errors: { name: 'Provider errors', unit: 'count' },
    ...Object.fromEntries(tiers.flatMap(t => [
      [t + 'Low', { name: t + ' lower 95% confidence limit', unit: 'score' }],
      [t + 'High', { name: t + ' upper 95% confidence limit', unit: 'score' }],
    ])) },
  async fetch() {
    const {data} = await fetchJson<{data: {package_url: string}}>(feed);
    const archive = Buffer.from(await fetchBytes(data.package_url));
    const json = execFileSync('tar', ['-xzOf', '-', 'assets/evals/day6_frontier_calibration.json'], {input: archive, encoding: 'utf8'});
    const {series}: {series: Record<string, Record<string, Tier>>} = JSON.parse(json);
    const rows = Object.entries(series).flatMap(([model, data]) => {
      if (tiers.some(t => !data[t])) return [];
      const metrics: Record<string,number> = { episodes: 0, missions: 0, violations: 0, steps: 0, capped: 0, errors: 0 };
      let total = 0;
      for (const t of tiers) {
        const v = data[t];
        total += v.mean_reward;
        metrics[t] = v.mean_reward;
        metrics[t + 'Low'] = v.ci95_low;
        metrics[t + 'High'] = v.ci95_high;
        metrics.episodes += v.n;
        metrics.missions += v.missions_completed;
        metrics.violations += v.hard_safety_violations;
        metrics.steps += v.mean_turns * v.n;
        metrics.capped += v.max_turn_outcomes;
        metrics.errors += v.provider_errors;
      }
      metrics.steps /= metrics.episodes;
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid calibration metrics');
      return [{ model, score: total / tiers.length, setting: 'Development split', metrics }];
    });
    return checked(rows, 2);
  },
};
export default board;
