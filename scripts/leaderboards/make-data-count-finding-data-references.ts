// This contest tests detection and classification of data citations in research papers. Kaggle ranks entries by private-test F1.
// The first-place write-up identifies CatBoost and Qwen. The fourth-place reproduction repository identifies three Qwen2.5 sizes.
// https://github.com/rbiswasfc/mdc-4th-place-solution
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.kaggle.com/api/i/competitions.LeaderboardService/GetLeaderboard';
const systems = [
  { id: 13972402, models: ['CatBoost', 'Qwen'] },
  { id: 13963287, models: ['Qwen2.5-72B', 'Qwen2.5-32B', 'Qwen2.5-14B'] },
  { id: 13957674, models: ['Qwen2.5-7B-Instruct', 'Qwen2.5-32B-Instruct'] },
];
type Result = { teamId: number; displayScore: string };
type Team = { teamId: number; teamName: string; solutionWriteUpUrl?: string };
const board: Leaderboard = {
  benchmark: 'make-data-count-finding-data-references', feed,
  url: 'https://www.kaggle.com/competitions/make-data-count-finding-data-references/leaderboard',
  terms: 'Kaggle competition rules apply. https://www.kaggle.com/competitions/make-data-count-finding-data-references/rules',
  harnesses: 'system', aliases: { 'Qwen2.5-7B-Instruct': 'qwen2-5-7b', 'Qwen2.5-32B-Instruct': 'qwen2-5-32b' },
  async fetch() {
    const data = await fetchJson<{ teams: Team[]; privateLeaderboard: Result[]; publicLeaderboard: Result[] }>(feed, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ competitionId: 82370 }),
    });
    return checked(systems.map(({ id, models }) => {
      const team = data.teams.find(t => t.teamId === id);
      const privateScore = data.privateLeaderboard.find(r => r.teamId === id)?.displayScore;
      const publicScore = data.publicLeaderboard.find(r => r.teamId === id)?.displayScore;
      if (!team?.teamName || !privateScore || !publicScore || ![privateScore, publicScore].every(v => /^0\.\d+$/.test(v))) throw new Error('Missing Kaggle team scores');
      return { model: models[0], models, harness: team.teamName, submitter: team.teamName, score: Number(privateScore),
        metrics: { publicScore: Number(publicScore) }, link: team.solutionWriteUpUrl ? new URL(team.solutionWriteUpUrl, feed).href : undefined };
    }), 3);
  },
};
export default board;
