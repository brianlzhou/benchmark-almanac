// GBA Eval (Mechanize). gbaeval.com/leaderboard fills its table from /results/leaderboard.json: per
// attempt the label, model id, provider, grading time, the overall score (0 to 1, a weighted mean of
// gameplay replays 60%, audio 20% and procedural tests 20%; the board's ranking) and per-test results.
// Overall is the score, as a percent. Attempts never graded (no grading time) are skipped. Runs through the
// goose or Codex agents ("goose-kimi-k3", "codex-gpt-5-6-sol") get that agent as the harness; the grading
// time is the run date. Sections and subsystems are percentages. Tokens cover the complete attempt.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://gbaeval.com/results/leaderboard.json';

interface Entry {
  candidate?: string;
  model?: string;
  label?: string;
  overall?: number;
  graded_at?: string;
  baseline?: boolean;
  tokens_used?: number;
  checkpoints_count?: number;
  failure_summary?: { build_failed?: number, grading_failed?: number };
  sections?: Record<string, { score?: number, subsystems?: Record<string, number> }>;
  wall_clock_hours?: number;
}

const board: Leaderboard = {
  benchmark: 'gbaeval',
  url: 'https://gbaeval.com/leaderboard/',
  feed: `${FEED} (overall)`,
  terms: 'Public JSON behind the leaderboard page; gbaeval.com robots.txt allows all paths and the site states no terms.',
  parts: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const e of await fetchJson<Entry[]>(FEED)) {
      if (e.baseline || !e.graded_at || typeof e.overall !== 'number') continue;
      const model = e.model || e.label;
      if (!model) continue;
      const harness = /^goose-/.test(e.candidate ?? '') ? 'goose' : /^codex-/.test(e.candidate ?? '') ? 'Codex' : undefined;
      const metrics: Record<string, number> = {};
      if (typeof e.wall_clock_hours === 'number') metrics.latency = metrics.time = e.wall_clock_hours * 3600;
      if (typeof e.tokens_used === 'number') metrics.totalTokens = e.tokens_used;
      if (typeof e.checkpoints_count === 'number') metrics.checkpoints = e.checkpoints_count;
      if (typeof e.failure_summary?.build_failed === 'number') metrics.buildFailures = e.failure_summary.build_failed;
      if (typeof e.failure_summary?.grading_failed === 'number') metrics.gradingFailures = e.failure_summary.grading_failed;
      for (const [section, data] of Object.entries(e.sections ?? {})) {
        if (typeof data.score === 'number') {
          metrics[section] = data.score * 100;
          board.parts![section] = { name: section, group: 'Section' };
        }
        for (const [subsystem, value] of Object.entries(data.subsystems ?? {})) {
          if (typeof value !== 'number') continue;
          const key = subsystem.replace(/_(.)/g, (_, c: string) => c.toUpperCase());
          metrics[key] = value * 100;
          board.parts![key] = { name: subsystem.replaceAll('_', ' '), group: section };
        }
      }
      rows.push({ model, harness, score: Number((e.overall * 100).toFixed(2)), date: e.graded_at.slice(0, 10), metrics });
    }
    return rows;
  },
};
export default board;
