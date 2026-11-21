// PestCLEF ranks teams by F1 on a private plant-health relation extraction test. Kaggle’s public leaderboard service returns the final scores and team metadata.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://www.kaggle.com/api/i/competitions.LeaderboardService/GetLeaderboard";
interface Entry { teamId: number; rank?: number; displayScore: string }
interface Team { teamId:number; teamName:string; submissionCount:number; lastSubmissionDate?: string }

const board: Leaderboard = {
  benchmark: "pestclef-2026",
  url: "https://www.kaggle.com/competitions/pest-clef-2026/leaderboard",
  feed: FEED,
  terms: "Kaggle ranks teams. The organizers do not specify a reuse license for the Kaggle scores in their report. https://ceur-ws.org/Vol-4283/paper319.pdf The robots URL returns HTML.",
  stats: { submissions: { name: 'Submissions', unit: 'count' }, publicF1: { name: 'Public F1', unit: 'score', better: 'higher' } },
  async fetch() {
    const data = await fetchJson<{privateLeaderboard:Entry[]; publicLeaderboard:Entry[]; teams:Team[]}>(FEED, {
      method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({competitionId:125000}) });
    if (data.privateLeaderboard.length < 14) throw new Error('Missing private test standings');
    return data.privateLeaderboard.map(r => {
      const team = data.teams.find(t => t.teamId === r.teamId), pub = data.publicLeaderboard.find(p => p.teamId === r.teamId);
      const score = Number(r.displayScore);
      if (!team?.teamName || !r.displayScore || !Number.isFinite(score)) throw new Error('Incomplete PestCLEF score');
      const metrics: Record<string,number> = { submissions: team.submissionCount };
      if (pub?.displayScore) metrics.publicF1 = Number(pub.displayScore);
      const date = team.lastSubmissionDate?.slice(0, 10);
      return { model: team.teamName, submitter: team.teamName, score, ...(date ? { date } : {}), metrics };
    });
  },
};
export default board;
