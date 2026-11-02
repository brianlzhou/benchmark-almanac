// Perception Test multiple-choice video QA (Google DeepMind) on EvalAI, challenge 2091. The challenge page is
// an Angular app that reads EvalAI's public REST API; the Test Phase leaderboard (phase split 5171) comes from
// /api/jobs/challenge_phase_split/5171/leaderboard/, one entry per team with result [Top-1 accuracy, 0 to 1].
// The score is Top-1 times 100. Entries are challenge teams; a row keeps the submission's method name when it
// names one (for example "VideoLLaMA3-7B") and the team name otherwise, so only teams that submitted a plain
// model match a registry record. Host baselines (frequency priors) are dropped. The submission date is kept.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const SPLIT = 5171;
const FEED = `https://eval.ai/api/jobs/challenge_phase_split/${SPLIT}/leaderboard/?page_size=500`;

interface Entry {
  submission__participant_team__team_name: string;
  submission__method_name: string | null;
  submission__submitted_at: string;
  submission__is_baseline: boolean;
  result: number[];
  leaderboard__schema: { labels: string[]; default_order_by?: string };
}

const board: Leaderboard = {
  benchmark: 'perception-test-mcvqa',
  url: 'https://eval.ai/web/challenges/challenge-page/2091/leaderboard',
  feed: `${FEED} (Test Phase, Top-1)`,
  terms: "EvalAI's public challenge API needs no login; eval.ai serves no robots.txt rules and the open-source EvalAI platform states no reuse limits for public leaderboards.",
  async fetch() {
    const data = await fetchJson<{ results: Entry[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const e of data.results) {
      const col = e.leaderboard__schema.labels.indexOf('Top-1');
      if (col < 0) throw new Error(`no Top-1 column: ${e.leaderboard__schema.labels.join(', ')}`);
      if (e.submission__is_baseline) continue;
      const model = e.submission__method_name?.trim() || e.submission__participant_team__team_name;
      rows.push({ model, score: e.result[col] * 100, date: e.submission__submitted_at.slice(0, 10) });
    }
    return rows;
  },
};
export default board;
