// BLINK (test split). The official board is EvalAI challenge 2287, whose page loads its table from EvalAI's
// public API: /api/jobs/challenge_phase_split/<id>/leaderboard/ returns one entry per public submission with
// the team, method name, submission time and the result row in the order of the split's leaderboard_schema
// labels. "Total" (accuracy as a fraction) × 100 is the score. Host-team baselines may resolve to
// catalog models. Participant submissions remain unlisted under their public submission IDs,
// preserving results without inferring model identity from method labels. Model cards mostly cite the
// validation split, which has no board. evalaiRows is shared with other EvalAI challenges.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson } from '../lib/util.ts';

export const EVALAI_TERMS = "EvalAI's public leaderboard API, the endpoint its challenge pages read; eval.ai has no robots.txt rules and EvalAI's code is open source (Cloud-CV/EvalAI).";
export const evalaiFeed = (split: number) => `https://eval.ai/api/jobs/challenge_phase_split/${split}/leaderboard/?page_size=100`;

interface Entry {
  submission__participant_team__team_name?: string;
  submission__method_name?: string;
  submission__submitted_at?: string;
  result?: number[];
}

/** One row per public submission by `team`, scored by the result at `index` times `scale`. */
export async function evalaiRows(split: number, team: string, index = 0, scale = 100): Promise<LeaderboardRow[]> {
  const rows: LeaderboardRow[] = [];
  let next: string | null = evalaiFeed(split);
  while (next) {
    const page: { next: string | null; results: Entry[] } = await fetchJson(next);
    for (const e of page.results) {
      const v = e.result?.[index];
      const model = e.submission__method_name?.trim();
      if (!model || typeof v !== 'number' || e.submission__participant_team__team_name !== team) continue;
      rows.push({ model, score: v * scale, date: e.submission__submitted_at?.slice(0, 10) });
    }
    next = page.next;
  }
  if (!rows.length) throw new Error(`no entries on EvalAI split ${split}`);
  return rows;
}

import { mdTables } from './big-bench-extra-hard.ts';

const board: Leaderboard = {
  benchmark: 'blink',
  url: 'https://eval.ai/web/challenges/challenge-page/2287/leaderboard/5658',
  feed: `${evalaiFeed(5658)} and https://raw.githubusercontent.com/zeyofu/BLINK_Benchmark/main/README.md (test split)`,
  terms: EVALAI_TERMS,
  aliases: {
    'Claude 3 OPUS': 'claude-3-opus',
    'Gemini Pro': 'gemini-1-0-pro',
    'LLaVA-1.6-34B': 'llava-v1-6-34b',
  },
  // The README adds GPT-4o and GPT-4 Turbo after the EvalAI host submissions.
  // Keep the precise API rows and add those two published test results without assigning snapshots.
  async fetch() {
    const rows = await evalaiRows(5658, 'Host_28919_Team');
    const md = await fetchText('https://raw.githubusercontent.com/zeyofu/BLINK_Benchmark/main/README.md');
    const t = mdTables(md).find(t => t.head.includes('Test (1,907)'));
    if (!t) throw new Error('BLINK README test table missing');
    for (const r of t.rows) {
      const model = r[0].replace(/^[^A-Za-z]+/, '').trim();
      if (!['GPT-4o', 'GPT-4 Turbo'].includes(model)) continue;
      const score = Number(r[2]);
      if (Number.isFinite(score)) rows.push({ model: `${model} (snapshot unspecified)`, score, metrics: { validation: Number(r[1]) } });
    }
    // Public participant methods are preserved as unlisted submissions, not attributed to
    // a foundation model from a free-text method name. The shared host-only reader stays unchanged.
    type PublicEntry = Entry & { id: number; error?: unknown; leaderboard__schema?: {labels?: string[]} };
    let next: string | null = evalaiFeed(5658);
    while (next) {
      const page: {next: string | null; results: PublicEntry[]} = await fetchJson(next);
      for (const e of page.results) {
        if (e.submission__participant_team__team_name === 'Host_28919_Team' || e.error) continue;
        const score = e.result?.[0];
        if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) continue;
        const metrics: Record<string, number> = {};
        for (const [i, label] of (e.leaderboard__schema?.labels ?? []).entries()) {
          const value = e.result?.[i];
          if (i > 0 && typeof value === 'number' && Number.isFinite(value)) metrics[label] = value * 100;
        }
        rows.push({model: `BLINK submission ${e.id}: ${e.submission__method_name?.trim() || e.submission__participant_team__team_name || 'unnamed'}`, score: score * 100, harness: e.submission__participant_team__team_name, date: e.submission__submitted_at?.slice(0,10), metrics});
      }
      next = page.next;
    }
    return rows;
  },
};
export default board;
