// GBA Eval (Mechanize). gbaeval.com/leaderboard fills its table from /results/leaderboard.json: per
// attempt the label, model id, provider, grading time, the overall score (0 to 1, a weighted mean of
// gameplay replays 60%, audio 20% and procedural tests 20%; the board's ranking) and per-test results.
// Overall is the score, as a percent. Attempts never graded (no grading time) are skipped. Runs through the
// goose or Codex agents ("goose-kimi-k3", "codex-gpt-5-6-sol") get that agent as the harness; the grading
// time is the run date.
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
}

const board: Leaderboard = {
  benchmark: 'gbaeval',
  url: 'https://gbaeval.com/leaderboard/',
  feed: `${FEED} (overall)`,
  terms: 'Public JSON behind the leaderboard page; gbaeval.com robots.txt allows all paths and the site states no terms.',
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const e of await fetchJson<Entry[]>(FEED)) {
      if (e.baseline || !e.graded_at || typeof e.overall !== 'number') continue;
      const model = e.model || e.label;
      if (!model) continue;
      const harness = /^goose-/.test(e.candidate ?? '') ? 'goose' : /^codex-/.test(e.candidate ?? '') ? 'Codex' : undefined;
      rows.push({ model, harness, score: Number((e.overall * 100).toFixed(2)), date: e.graded_at.slice(0, 10) });
    }
    return rows;
  },
};
export default board;
