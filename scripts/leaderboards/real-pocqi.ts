// Real-POCQi compares clinical answers to 620 physician questions.
// The headline is the primary text-only accuracy one-vs-rest win difference.
// This importer reads the fixed primary row in Table 3 of the paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const rows: LeaderboardRow[] = [
  { model: 'OpenEvidence', score: 24.7, low: 18.4, high: 30.8 },
  { model: 'GPT-5.5', score: -21.1, low: -29.1, high: -13.3 },
  { model: 'Claude Opus 4.8', score: -1.5, low: -9.3, high: 6.3 },
  { model: 'Gemini 3.1 Pro', score: -2.1, low: -9.5, high: 5.3 },
];
const board: Leaderboard = {
  benchmark: 'real-pocqi', static: 'paper',
  url: 'https://arxiv.org/html/2606.28960', feed: 'https://arxiv.org/html/2606.28960#S9.T3',
  terms: 'The authors publish the paper under arXiv terms. Table 3 is credited to the authors.',
  async fetch(): Promise<LeaderboardRow[]> { return rows; },
};
export default board;
