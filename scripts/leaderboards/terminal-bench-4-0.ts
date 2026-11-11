// Terminal-Bench 4.0 and 4.1. tbench.ai renders every Terminal-Bench leaderboard from the Harbor Hub registry: its
// client POSTs {package, name} to a public Supabase edge function, leaderboard-read, and gets back the
// board's columns plus every row (metadata: agent, model, effort, date; metrics: accuracy 0 to 100).
// The other versions (2.0, 2.1, 3.0) import makeTerminalBench from this file.
//
// The site shows the best effort per agent and model by default, with an "all efforts" toggle. Every
// effort is kept here, with the effort in `setting`, so the almanac can pick.
//
// With `extras` (on for 4.0), each row also carries what the row's metrics give: cost per trial (total_cost_usd
// over n_trials; a zero total means unknown), output tokens per trial, pass@2 to pass@5 ("passAt2".."passAt5", %),
// the 95% confidence half-width ("ci95", points) and the mean trial time ("time", seconds). The board's Pareto
// view plots accuracy against total run time; with a fixed trial count that is the same frontier as mean time.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

export const HARBOR_FEED = 'https://ofhuhcpkvzjlejydnvyd.supabase.co/functions/v1/leaderboard-read';
const FEED = HARBOR_FEED;

export type Link = string | { label?: string; url?: string };
interface Row {
  status?: string;
  metadata: {
    agent_display?: Link;
    model_display?: Link;
    model_names?: string[];
    reasoning_effort?: string;
    date?: string;
    release_date?: string;
  };
  metrics: {
    accuracy?: number;
    n_trials?: number;
    total_cost_usd?: number;
    output_tokens?: number;
    avg_trial_duration_sec?: number;
    accuracy_ci95_half_width?: number;
    pass_at_2?: number;
    pass_at_3?: number;
    pass_at_4?: number;
    pass_at_5?: number;
  };
}

const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

/** Cost, tokens and other numbers from a row's metrics, per trial where the feed gives totals. */
function extrasOf(m: Row['metrics']): Pick<LeaderboardRow, 'cost' | 'tokens' | 'metrics'> {
  const n = num(m.n_trials) && m.n_trials > 0 ? m.n_trials : undefined;
  const metrics: Record<string, number> = {};
  for (const k of [2, 3, 4, 5] as const) {
    const v = m[`pass_at_${k}`];
    if (num(v)) metrics[`passAt${k}`] = Math.round(v * 1e4) / 100;
  }
  if (num(m.accuracy_ci95_half_width)) metrics.ci95 = m.accuracy_ci95_half_width;
  if (num(m.avg_trial_duration_sec) && m.avg_trial_duration_sec > 0) metrics.time = m.avg_trial_duration_sec;
  return {
    cost: n && num(m.total_cost_usd) && m.total_cost_usd > 0 ? m.total_cost_usd / n : undefined,
    tokens: n && num(m.output_tokens) && m.output_tokens > 0 ? m.output_tokens / n : undefined,
    metrics: Object.keys(metrics).length ? metrics : undefined,
  };
}

export const label = (l?: Link) => (typeof l === 'string' ? l : l?.label)?.trim();

/** One board in the registry: package "terminal-bench/terminal-bench", leaderboard name "4-0-0". */
export function makeTerminalBench(opts: {
  benchmark: string;
  version: string;
  pkg: string;
  name: string;
  aliases?: Record<string, string>;
  /** Also read cost, output tokens, pass@k, the confidence interval and trial time, and declare the Pareto chart. */
  extras?: boolean;
  /**
   * An earlier board of the same tasks, graded the older way. Its rows fill in runs the main board doesn't have
   * yet, with "<version> grader" added to their setting.
   */
  fallback?: { name: string; version: string };
}): Leaderboard {
  return {
    benchmark: opts.benchmark,
    url: `https://www.tbench.ai/?version=${opts.version}`,
    feed: `${FEED} (POST {"package":"${opts.pkg}","name":"${opts.name}"})`,
    terms:
      'Public, unauthenticated Harbor Hub endpoint that tbench.ai itself calls, under the Harbor Hub Terms of Service; the Terminal-Bench repository is Apache-2.0.',
    aliases: opts.aliases,
    ...(opts.extras
      ? {
          chart: {
            title: 'Pareto: accuracy against time',
            note: 'Each point is one agent, model and effort. The board plots total run time; this plots the mean time per trial, the same frontier at a fixed trial count.',
            x: { key: 'time', label: 'Mean time per trial', unit: 's', better: 'lower', log: true },
            y: { key: 'score', label: 'Accuracy', unit: '%', better: 'higher' },
          },
        }
      : {}),
    async fetch() {
      const read = async (name: string): Promise<LeaderboardRow[]> => {
        const body = JSON.stringify({ package: opts.pkg, name });
        const res = JSON.parse(
          await fetchText(FEED, { method: 'POST', headers: { 'content-type': 'application/json' }, body }),
        ) as { leaderboard: { title: string }; rows: Row[] };
        const out: LeaderboardRow[] = [];
        for (const r of res.rows) {
          if (r.status && r.status !== 'display') continue;
          const model = label(r.metadata.model_display);
          // "Multiple" marks agents that route between models; there is no one model to credit
          if (!model || /^multiple$/i.test(model)) continue;
          out.push({
            model,
            score: Number(r.metrics.accuracy),
            setting: r.metadata.reasoning_effort?.toLowerCase() || undefined,
            harness: label(r.metadata.agent_display),
            date: r.metadata.date ?? r.metadata.release_date,
            ...(opts.extras ? extrasOf(r.metrics) : {}),
          });
        }
        return out;
      };
      const out = await read(opts.name);
      if (!opts.fallback) return out;
      const key = (r: LeaderboardRow) => `${r.model}|${r.harness ?? ''}|${r.setting ?? ''}`;
      const have = new Set(out.map(key));
      for (const r of await read(opts.fallback.name)) {
        if (have.has(key(r))) continue;
        out.push({ ...r, setting: [r.setting, `${opts.fallback.version} grader`].filter(Boolean).join(', ') });
      }
      return out;
    },
  };
}

// Terminal-Bench 4.1 (2026-11-03) kept the 4.0 tasks and regraded the 4.0 runs with hardened verifiers, so it
// stays this record. Its board leads, and runs not yet regraded come from the 4.0 board.
export default makeTerminalBench({
  benchmark: 'terminal-bench-4-0',
  version: '4.1',
  pkg: 'terminal-bench/terminal-bench',
  name: '4-1-0',
  extras: true,
  fallback: { name: '4-0-0', version: '4.0' },
});
