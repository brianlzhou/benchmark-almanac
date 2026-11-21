// Kaggle ranks Bengali speech recognition teams by word error rate on the private test set. Its public standings service reports WER as a fraction.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface Entry { teamId: number; displayScore: string }
interface Team {teamId: number; teamName: string; submissionCount: number; lastSubmissionDate?: string; solutionWriteUpUrl?: string}

const feed = "https://www.kaggle.com/api/i/competitions.LeaderboardService/GetLeaderboard";
const board: Leaderboard = {
  benchmark: 'ood-speech-bengali',
  url: "https://www.kaggle.com/competitions/bengaliai-speech/leaderboard",
  feed,
  terms: "Kaggle's robots URL returns HTML. Table 2 compares two systems on the paper partitions by domain. Kaggle has a separate private ranking. The paper does not state a score reuse license. https://arxiv.org/pdf/2305.09688",
  stats: {
    publicWer: { name: 'Public word error rate', unit: '%', better: 'lower' },
    submissions: { name: 'Submissions', unit: 'count' },
  },
  async fetch() {
    const data = await fetchJson<{privateLeaderboard: Entry[]; publicLeaderboard: Entry[]; teams: Team[]}>(feed, {
      method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({competitionId: 52324}) });
    if (data.privateLeaderboard.length < 745) throw new Error('Missing private leaderboard teams');
    const teams = new Map(data.teams.map(t => [t.teamId, t]));
    const pub = new Map(data.publicLeaderboard.map(r => [r.teamId, Number(r.displayScore) * 100]));
    return data.privateLeaderboard.map(r => {
      const team = teams.get(r.teamId), score = Number(r.displayScore) * 100;
      if (!team?.teamName || !r.displayScore || !Number.isFinite(score)) throw new Error('Invalid private WER');
      const metrics: Record<string, number> = { submissions: team.submissionCount };
      const publicWer = pub.get(r.teamId);
      if (publicWer != null) metrics.publicWer = publicWer;
      return { model: team.teamName, submitter: team.teamName, score, metrics,
        link: team.solutionWriteUpUrl ? new URL(team.solutionWriteUpUrl, feed).href : undefined };
    });
  },
};
export default board;
