// τ-bench family (Sierra). taubench.com reads a public S3 bucket: submissions/manifest.json lists the
// submission folders, and each folder's submission.json holds pass^1..pass^4 per domain. The site's
// "τ²-bench" tab ranks Overall pass^1, the mean of retail, airline and telecom pass^1 (a row needs all
// three), and its "τ³-Banking" tab ranks banking_knowledge pass^1. Custom-scaffold submissions are hidden
// by default on the site and are left out here.
//
// The site's table also shows Overall pass^2 to pass^4, kept here in `metrics` ("pass2".."pass4", %), and each
// domain's "Avg Cost" per task; a row's cost is the mean of the three domains' costs when all three have one.
//
// Versions do not mix. "legacy_submissions" ran τ²-bench 0.x on the original tasks; "submissions" ran
// release 1.0.x (τ³-bench), whose airline and retail tasks were fixed. So:
//   tau2-bench    legacy submissions, Overall pass^1 (the site shows them with "Show legacy")
//   tau3-bench    current submissions, Overall pass^1 over the fixed retail/airline/telecom tasks
//   tau3-banking  current submissions, banking_knowledge pass^1 (tau3-banking.ts)
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const BASE = 'https://sierra-tau-bench-public.s3.us-west-2.amazonaws.com/submissions';

interface Domain {
  pass_1?: number | null;
  pass_2?: number | null;
  pass_3?: number | null;
  pass_4?: number | null;
  /** US dollars per task, the site's "Avg Cost". */
  cost?: number | null;
}
interface Submission {
  model_name: string;
  submission_type?: string;
  submission_date?: string;
  reasoning_effort?: string | null;
  results: Record<string, Domain | undefined>;
  methodology?: { evaluation_date?: string; tau2_bench_version?: string };
}

export async function loadTau(kind: 'submissions' | 'legacy_submissions'): Promise<Submission[]> {
  const manifest = await fetchJson<Record<string, string[]>>(`${BASE}/manifest.json`);
  const dirs = manifest[kind] ?? [];
  const subs = await Promise.all(dirs.map((d) => fetchJson<Submission>(`${BASE}/${d}/submission.json`).catch(() => null)));
  return subs.filter((s): s is Submission => !!s && (s.submission_type ?? 'standard') === 'standard');
}

/** The site's Overall: mean pass^1 of retail, airline and telecom, or null if a domain is missing. */
export function overall(s: Submission): number | null {
  const v = ['retail', 'airline', 'telecom'].map((d) => s.results[d]?.pass_1);
  return v.every((x) => typeof x === 'number') ? (v as number[]).reduce((a, b) => a + b, 0) / 3 : null;
}

/**
 * The site's Overall pass^2 to pass^4 (each the mean over retail, airline and telecom), and the mean cost per task
 * when all three domains report one. Fields are left out when the submission lacks them.
 */
export function overallExtras(s: Submission): Pick<LeaderboardRow, 'cost' | 'metrics'> {
  const domains = ['retail', 'airline', 'telecom'].map((d) => s.results[d]);
  const mean = (v: (number | null | undefined)[]) =>
    v.every((x) => typeof x === 'number') ? (v as number[]).reduce((a, b) => a + b, 0) / v.length : undefined;
  const metrics: Record<string, number> = {};
  for (const k of [2, 3, 4] as const) {
    const m = mean(domains.map((d) => d?.[`pass_${k}`]));
    if (m !== undefined) metrics[`pass${k}`] = m;
  }
  const cost = mean(domains.map((d) => d?.cost));
  return { cost: cost && cost > 0 ? cost : undefined, metrics: Object.keys(metrics).length ? metrics : undefined };
}

export function row(s: Submission, score: number): LeaderboardRow {
  return {
    model: s.model_name,
    score,
    setting: s.reasoning_effort?.toLowerCase() || undefined,
    date: s.methodology?.evaluation_date ?? s.submission_date,
  };
}

export const TERMS = 'Public S3 bucket that taubench.com reads (sierra-tau-bench-public); the tau2-bench repository is MIT-licensed.';
export const ALIASES: Record<string, string> = {
  'Claude-3.7-Sonnet': 'claude-3-7-sonnet',
  'Claude-Sonnet-4.5': 'claude-sonnet-4-5',
  'Gemini 3.0 Pro': 'gemini-3-pro',
  // the legacy folder is kimi-k2_moonshot-ai_2025-07-11, the July 2025 release
  'Kimi-k2': 'kimi-k2-jul-2025',
};

const board: Leaderboard = {
  benchmark: 'tau2-bench',
  url: 'https://taubench.com/leaderboard?benchmark=core',
  feed: `${BASE}/manifest.json (legacy_submissions)`,
  terms: TERMS,
  aliases: ALIASES,
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const s of await loadTau('legacy_submissions')) {
      const score = overall(s);
      if (score !== null) rows.push({ ...row(s, score), ...overallExtras(s) });
    }
    return rows;
  },
};
export default board;
