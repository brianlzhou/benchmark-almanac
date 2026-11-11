// VQAv2. visualqa.org runs its leaderboard as the VQA Challenge 2021 on EvalAI (challenge 830), whose
// public API serves the test-standard board as JSON: per submission the team, the method name, the
// submission time and four accuracies (yes/no, number, other, overall). Overall (VQA accuracy, 0 to 100)
// is the board's sort column and the score. Preserve every public submission. Recognized makers keep
// their established model names; other entries retain team/method identities without guessing a model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://eval.ai/web/challenges/challenge-page/830/leaderboard/2278';
const FEED = 'https://eval.ai/api/jobs/challenge_phase_split/2278/leaderboard/?page_size=500';

interface Entry {
  id?: number;
  submission__id?: number;
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
    const visited = new Set<string>();
    for (let page = 0; next && page < 100; page++) {
      if (visited.has(next) || !next.startsWith('https://eval.ai/api/jobs/challenge_phase_split/2278/leaderboard/')) throw new Error('Unexpected VQA pagination URL');
      visited.add(next);
      if (page) await new Promise(resolve => setTimeout(resolve, 1000));
      const data: { next: string | null; results: Entry[] } = await fetchJson(next);
      for (const e of data.results) {
        const team = e.submission__participant_team__team_name.trim();
        const method = (e.submission__method_name ?? '').trim();
        const t = TEAMS[team];
        const known = typeof t === 'function' ? t(method) : t;
        const model = known || `${team || 'Unnamed team'} / ${method || 'Unnamed method'}`;
        const score = e.result?.[3];
        if (!Number.isFinite(score)) continue;
        const metrics: Record<string, number> = {};
        ['yesNo', 'number', 'other'].forEach((key, i) => { if (Number.isFinite(e.result[i])) metrics[key] = e.result[i]; });
        rows.push({ model, score, date: e.submission__submitted_at?.slice(0, 10),
          setting: known ? undefined : `EvalAI submission ${e.submission__id ?? e.id ?? `${page}-${rows.length}`}`,
          metrics });
      }
      next = data.next;
    }
    if (next) throw new Error('VQA pagination limit exceeded');
    if (!rows.length) throw new Error('No public submissions found on the VQA board');
    return rows;
  },
};
export default board;
