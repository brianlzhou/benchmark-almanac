// DeepSWE (Datacurve). deepswe.datacurve.ai renders its leaderboard from static artifacts, one per task-set
// version: /artifacts/<version>/leaderboard-live.json, with a row per harness + model + reasoning effort and
// pass_at_1 (attempt pass rate, 0 to 1) as the headline. The page toggles v1.1 (current) and v1. Version 1.1
// kept the same 113 tasks and only fixed flaky tests, so the almanac keeps one record and reads the current board.
// Each row also carries the table's ± (ci_half, as "ci95" in points), Steps (mean_agent_steps, "steps"), and the
// artifact's pass@4 ("passAt4", %) and mean attempt time ("time", seconds). The board's chart plots the score
// against cost, output tokens or agent steps. Keep the separate resource statistics and each attempt’s pass rate.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

interface Row {
  completed_by_attempt?: number[];
  pass_rate_by_attempt?: number[];
  model: string;
  harness?: string;
  reasoning_effort?: string | null;
  pass_at_1?: number;
  /** Mean cost and output tokens per task attempt, priced as the row's cost_basis says. */
  mean_cost_usd?: number | null;
  mean_output_tokens?: number | null;
  pass_at_4?: number | null;
  /** Half-width of the 95% run-to-run interval, 0 to 1. */
  ci_half?: number | null;
  ci_lo?: number | null;
  ci_hi?: number | null;
  n_runs?: number | null;
  mean_agent_steps?: number | null;
  mean_duration_seconds?: number | null;
}

const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const round = (x: number, d: number) => Number(x.toFixed(d));

const meanKeys: Record<string, string> = {
  mean_input_tokens: 'inputTokens',
  mean_output_tokens: 'outputTokens',
  mean_reasoning_tokens: 'reasoningTokens',
  mean_cache_read_tokens: 'cachedTokens',
};

function resourceMetrics(row: Row): Record<string, number> {
  const metrics: Record<string, number> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key !== 'mean_agent_steps' && num(value) && /^(mean_|median_|n_(?:passed|attempted|tasks_)|ci_(?:passed|attempted))/.test(key)) metrics[meanKeys[key] ?? key] = value;
  }
  row.pass_rate_by_attempt?.forEach((value, i) => {
    if (num(value)) metrics[`attempt${i + 1}PassRate`] = value * 100;
  });
  row.completed_by_attempt?.forEach((value, i) => {
    if (num(value)) metrics[`attempt${i + 1}Completed`] = value;
  });
  return metrics;
}

export function makeDeepSwe(benchmark: string, version: string): Leaderboard {
  const feed = `https://deepswe.datacurve.ai/artifacts/${version}/leaderboard-live.json`;
  return {
    benchmark,
    url: 'https://deepswe.datacurve.ai/',
    feed,
    terms: 'Static JSON artifact on the DeepSWE site (robots.txt allows it); the deep-swe repository is Apache-2.0.',
    aliases: {},
    chart: {
      title: 'DeepSWE score and agent steps',
      note: 'Each point is one harness, model and reasoning effort; steps are the mean agent steps per task attempt.',
      x: { key: 'steps', label: 'Mean agent steps', unit: 'steps', better: 'lower', log: true },
      y: { key: 'score', label: 'Pass@1', unit: '%', better: 'higher' },
    },
    async fetch() {
      const { rows } = await fetchJson<{ rows: Row[] }>(feed);
      return rows
        .filter((r) => typeof r.pass_at_1 === 'number')
        .map((r) => ({
          model: r.model,
          score: r.pass_at_1! * 100,
          setting: r.reasoning_effort?.toLowerCase() || undefined,
          harness: r.harness,
          trials: num(r.n_runs) && Number.isInteger(r.n_runs) && r.n_runs > 0 ? r.n_runs : undefined,
          low: num(r.ci_lo) ? r.ci_lo * 100 : undefined,
          high: num(r.ci_hi) ? r.ci_hi * 100 : undefined,
          cost: r.mean_cost_usd ?? undefined,
          tokens: r.mean_output_tokens ?? undefined,
          metrics: {
            ...resourceMetrics(r),
            ...(num(r.ci_half) ? { ci95: round(r.ci_half * 100, 2) } : {}),
            ...(num(r.mean_agent_steps) ? { steps: round(r.mean_agent_steps, 1) } : {}),
            ...(num(r.pass_at_4) ? { passAt4: round(r.pass_at_4 * 100, 2) } : {}),
            ...(num(r.mean_duration_seconds) ? { time: round(r.mean_duration_seconds, 1) } : {}),
          },
        }));
    },
  };
}

export default makeDeepSwe('deepswe', 'v1.1');
