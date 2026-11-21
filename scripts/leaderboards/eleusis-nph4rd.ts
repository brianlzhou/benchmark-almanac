// Eleusis tests long-horizon inductive rule discovery with card-play feedback.
// The score is the percentage of selected episodes solved by the model setting.
// This importer reads the author's October 2026 results article and its published model comparison.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://nphard.io/2026/10/07/eleusinian-swarms.html';

const board: Leaderboard = {
  benchmark: 'eleusis-nph4rd',
  url: feed,
  feed,
  static: 'paper',
  stats: {
    soloSolveRate: { name: 'Solo solve rate', unit: '%', better: 'higher' },
    independentSolveRate: { name: 'Independent solve rate', unit: '%', better: 'higher' },
    cooperativeSolves: { name: 'Cooperative solves', unit: 'count', better: 'higher' },
    episodes: { name: 'Episodes', unit: 'count' },
  },
  terms: 'The results article is published by nphard.io and its linked repository uses the repository license. https://github.com/PrimeIntellect-ai/residency-environments GitHub requests a one-second crawl delay.',
  async fetch() {
    const source = await fetchText(feed);
    const match = source.match(/DeepSeek went from (\d+)\/90 solves alone to (\d+)\/90 independently and (\d+)\/90 cooperatively; Luna went from (\d+) to (\d+) to (\d+), and Sol from (\d+) to (\d+) to (\d+)/);
    if (!match) throw new Error('Missing Eleusis model solve-rate comparison');
    const values = match.slice(1).map(Number);
    if (values.some(value => !Number.isFinite(value))) throw new Error('Invalid Eleusis solve counts');
    const models = [
      ['DeepSeek V4.1 Flash', values[0], values[1], values[2]],
      ['GPT-6 Luna', values[3], values[4], values[5]],
      ['GPT-6 Sol', values[6], values[7], values[8]],
    ] as const;
    const rows: LeaderboardRow[] = models.map(([model, solo, independent, cooperative]) => ({
      model,
      score: cooperative * 100 / 90,
      setting: 'Three-agent cooperative team with broadcast messaging',
      metrics: {
        soloSolveRate: solo * 100 / 90,
        independentSolveRate: independent * 100 / 90,
        cooperativeSolves: cooperative,
        episodes: 90,
      },
    }));
    if (rows.length !== 3) throw new Error('Expected three Eleusis models');
    return rows;
  },
};

export default board;
