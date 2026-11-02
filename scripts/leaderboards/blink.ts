// BLINK (test split). The official board is EvalAI challenge 2287, whose page loads its table from EvalAI's
// public API: /api/jobs/challenge_phase_split/<id>/leaderboard/ returns one entry per public submission with
// the team, method name, submission time and the result row in the order of the split's leaderboard_schema
// labels. "Total" (accuracy as a fraction) × 100 is the score. Rows posted by the host team are the authors'
// baselines. Other rows are participants' submissions and are named by their method, so many stay unmatched.
// Model cards mostly cite the validation split, which has no board. evalaiRows is shared with other EvalAI
// challenges.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const EVALAI_TERMS = "EvalAI's public leaderboard API, the endpoint its challenge pages read; EvalAI is open source (BSD-3-Clause).";
export const evalaiFeed = (split: number) => `https://eval.ai/api/jobs/challenge_phase_split/${split}/leaderboard/?page_size=100`;

interface Entry {
  submission__participant_team__team_name?: string;
  submission__method_name?: string;
  submission__submitted_at?: string;
  result?: number[];
}

/** One row per public submission, scored by the result at `index` times `scale`. */
export async function evalaiRows(split: number, index = 0, scale = 100): Promise<LeaderboardRow[]> {
  const rows: LeaderboardRow[] = [];
  let next: string | null = evalaiFeed(split);
  while (next) {
    const page: { next: string | null; results: Entry[] } = await fetchJson(next);
    for (const e of page.results) {
      const v = e.result?.[index];
      const model = e.submission__method_name?.trim();
      if (!model || typeof v !== 'number') continue;
      rows.push({ model, score: v * scale, date: e.submission__submitted_at?.slice(0, 10) });
    }
    next = page.next;
  }
  if (!rows.length) throw new Error(`no entries on EvalAI split ${split}`);
  return rows;
}

const board: Leaderboard = {
  benchmark: 'blink',
  url: 'https://eval.ai/web/challenges/challenge-page/2287/leaderboard/5658',
  feed: `${evalaiFeed(5658)} (Total, test split)`,
  terms: EVALAI_TERMS,
  aliases: {
    'Claude 3 OPUS': 'claude-3-opus',
    'Gemini Pro': 'gemini-1-0-pro',
    'Doubao-1.5-pro': 'doubao-1-5-pro',
  },
  fetch: () => evalaiRows(5658),
};
export default board;
