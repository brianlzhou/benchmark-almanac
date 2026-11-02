// VQAv2. visualqa.org runs its leaderboard as the VQA Challenge 2021 on EvalAI (challenge 830), whose
// public API serves the test-standard board as JSON: per submission the team, the method name, the
// submission time and four accuracies (yes/no, number, other, overall). Overall (VQA accuracy, 0 to 100)
// is the board's sort column and the score. Most of the 500+ entries are anonymous student or test teams,
// so only submissions by a model's own makers are kept (the TEAMS table below), named for the model; the
// submission time is the run date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://eval.ai/web/challenges/challenge-page/830/leaderboard/2278';
const FEED = 'https://eval.ai/api/jobs/challenge_phase_split/2278/leaderboard/?page_size=500';

interface Entry {
  submission__participant_team__team_name: string;
  submission__method_name?: string | null;
  submission__submitted_at?: string;
  result: number[];
}

// team name on the board -> model name, or a function of the method name for teams with several models
const TEAMS: Record<string, string | ((method: string) => string | undefined)> = {
  'Allen Institute for AI': (m) => m || undefined,
  'Allen Institute for Artificial Intelligence': (m) => m || undefined,
  'PaliGemma 2': (m) => (/10B, 448px, finetune/.test(m) ? 'PaliGemma 2 10B 448px (VQAv2 fine-tune)' : undefined),
  'PaliGemma-3B': (m) => (/finetune, 448px/.test(m) ? 'PaliGemma 3B 448px (VQAv2 fine-tune)' : undefined),
  'PaLI-X - Google Research': 'PaLI-X',
  'PaLI - Google Research': 'PaLI',
  'BEiT-3': 'BEiT-3',
  'CoCa - Google Brain': 'CoCa',
  'SimVLM - Google Brain': 'SimVLM',
  'GIT2 - Single Generative Model': 'GIT2',
  'Prismer - Nvidia Research': 'Prismer',
};

const board: Leaderboard = {
  benchmark: 'vqav2',
  url: PAGE,
  feed: `${FEED} (test-standard, overall)`,
  terms: 'Public EvalAI challenge API (eval.ai serves no robots.txt rules); the VQA annotations are CC BY 4.0.',
  async fetch() {
    const rows: LeaderboardRow[] = [];
    let next: string | null = FEED;
    for (let page = 0; next && page < 5; page++) {
      const data: { next: string | null; results: Entry[] } = await fetchJson(next);
      for (const e of data.results) {
        const t = TEAMS[e.submission__participant_team__team_name.trim()];
        const model = typeof t === 'function' ? t((e.submission__method_name ?? '').trim()) : t;
        const score = e.result?.[3];
        if (!model || typeof score !== 'number') continue;
        rows.push({ model, score, date: e.submission__submitted_at?.slice(0, 10) });
      }
      next = data.next;
    }
    if (!rows.length) throw new Error('no maker submissions found on the VQA board');
    return rows;
  },
};
export default board;
