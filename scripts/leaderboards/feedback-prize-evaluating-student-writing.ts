// Feedback Prize: Evaluating Student Writing ranks submissions by overlap-based macro F1.
// Kaggle's final private standings give the headline score and team names.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://www.kaggle.com/api/i/competitions.LeaderboardService/GetLeaderboard";

const board: Leaderboard = {
  benchmark: "feedback-prize-evaluating-student-writing",
  url: "https://www.kaggle.com/competitions/feedback-prize-2021/leaderboard",
  feed,
  terms: "Kaggle's competition terms apply. The host has no robots.txt.",
  stats: { submissions: { name: 'Submissions', unit: 'count' }, publicScore: { name: 'Public score', unit: 'score', better: 'higher' } },
  async fetch() {
    type Entry = { teamId: number; displayScore: string };
    type Team = { teamId: number; teamName: string; submissionCount: number; lastSubmissionDate?: string; solutionWriteUpUrl?: string };
    const data = await fetchJson<{ privateLeaderboard?: Entry[]; publicLeaderboard: Entry[]; teams: Team[] }>(feed, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ competitionId: 31779 }),
    });
    const teams = new Map(data.teams.map(team => [team.teamId, team]));
    const publicScores = new Map(data.publicLeaderboard.map(entry => [entry.teamId, entry.displayScore]));
    const standings = data.privateLeaderboard;
    if (!standings || standings.length < 2058) throw new Error('Incomplete Kaggle standings');
    return standings.map(entry => {
      const team = teams.get(entry.teamId);
      const score = Number(entry.displayScore);
      if (!team?.teamName || !entry.displayScore || !Number.isFinite(score)) throw new Error('Invalid team score');
      const metrics: Record<string, number> = { submissions: team.submissionCount };
      const publicScore = publicScores.get(entry.teamId);
      if (publicScore) metrics.publicScore = Number(publicScore);
      return {
        model: team.teamName, submitter: team.teamName, score, metrics,
        date: team.lastSubmissionDate?.slice(0, 10),
        link: team.solutionWriteUpUrl ? new URL(team.solutionWriteUpUrl, feed).href : undefined,
      };
    });
  },
};
export default board;
