// DeepSWE (Datacurve). deepswe.datacurve.ai renders its leaderboard from static artifacts, one per task-set
// version: /artifacts/<version>/leaderboard-live.json, with a row per harness + model + reasoning effort and
// pass_at_1 (attempt pass rate, 0 to 1) as the headline. The page toggles v1.1 (current) and v1. Version 1.1
// kept the same 113 tasks and only fixed flaky tests, so the almanac keeps one record and reads the current board.
// Each row also carries the table's ± (ci_half, as "ci95" in points), Steps (mean_agent_steps, "steps"), and the
// artifact's pass@4 ("passAt4", %) and mean attempt time ("time", seconds). The board's chart plots the score
// against cost, output tokens or agent steps; the steps view is declared here.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

interface Row {
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
  mean_agent_steps?: number | null;
  mean_duration_seconds?: number | null;
}

const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const round = (x: number, d: number) => Number(x.toFixed(d));

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
          cost: r.mean_cost_usd ?? undefined,
          tokens: r.mean_output_tokens ?? undefined,
          metrics: {
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
