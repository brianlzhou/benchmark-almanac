// LMSYS Chatbot Arena Human Preference Predictions is a Kaggle competition for predicting anonymous user choices.
// The score is Kaggle's held-out log loss, where lower is better.
// This importer reads the final private standings from Kaggle's public leaderboard service.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://www.kaggle.com/competitions/lmsys-chatbot-arena/leaderboard';
const FEED = 'https://www.kaggle.com/api/i/competitions.LeaderboardService/GetLeaderboard';
const COMPETITION_ID = 66631;
interface Entry { teamId: number; displayScore: string }
interface Team { teamId: number; teamName: string; submissionCount: number; lastSubmissionDate?: string; solutionWriteUpUrl?: string }
interface Response { privateLeaderboard?: Entry[]; publicLeaderboard?: Entry[]; teams?: Team[] }

const board: Leaderboard = {
  benchmark: 'lmsys-chatbot-arena-human-preference-predictions',
  url: PAGE,
  feed: `${FEED} (competitionId ${COMPETITION_ID})`,
  terms: 'The source gives no verified license for third-party score reuse. Kaggle terms of use apply.',
  async fetch() {
    const data = await fetchJson<Response>(FEED, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ competitionId: COMPETITION_ID }) });
    const standings = data.privateLeaderboard;
    const teams = new Map((data.teams ?? []).map((team) => [team.teamId, team]));
    const publicScores = new Map((data.publicLeaderboard ?? []).map((entry) => [entry.teamId, entry.displayScore]));
    if (!standings || standings.length !== 1688 || teams.size !== 1688) throw new Error(`LMSYS Chatbot Arena predictions: incomplete standings (${standings?.length ?? 0} rows)`);
    return standings.map((entry) => {
      const team = teams.get(entry.teamId);
      const score = Number(entry.displayScore);
      if (!team?.teamName || !Number.isFinite(score)) throw new Error('LMSYS Chatbot Arena predictions: invalid row');
      const metrics: Record<string, number> = { submissions: team.submissionCount };
      const publicScore = publicScores.get(entry.teamId);
      if (publicScore) metrics.publicScore = Number(publicScore);
      return { model: team.teamName, submitter: team.teamName, score, date: team.lastSubmissionDate?.slice(0, 10), link: team.solutionWriteUpUrl || undefined, metrics };
    });
  },
};

export default board;
