// TetrisBench ranks models by their percentage of head-to-head Tetris games won.
// The comparison page reads the totals and each pair's record from its benchmark statistics endpoint.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://tetrisbench.com/api/benchmark-stats';
interface RecordOfPlay { wins: number; losses: number; draws: number; totalGames: number }
interface Stats {
  ok: boolean; models: string[]; modelNames: Record<string, string>;
  totals: Record<string, RecordOfPlay & { winRate: number }>;
  matrix: Record<string, Record<string, RecordOfPlay>>;
}
const board: Leaderboard = {
  benchmark: 'tetrisbench', url: 'https://tetrisbench.com/tetrisbench/', feed,
  terms: 'The public comparison page reads this endpoint without authentication.',
  stats: {
    wins: { name: 'Wins', unit: 'count' }, losses: { name: 'Losses', unit: 'count' },
    'wins vs Claude Fable 5': { name: 'Wins vs Claude Fable 5', unit: 'count' }, 'losses vs Claude Fable 5': { name: 'Losses vs Claude Fable 5', unit: 'count' },
    'wins vs Kimi K3': { name: 'Wins vs Kimi K3', unit: 'count' }, 'losses vs Kimi K3': { name: 'Losses vs Kimi K3', unit: 'count' },
    'wins vs GPT-5.6 Sol': { name: 'Wins vs GPT-5.6 Sol', unit: 'count' }, 'losses vs GPT-5.6 Sol': { name: 'Losses vs GPT-5.6 Sol', unit: 'count' },
    'wins vs Claude Opus 4.8': { name: 'Wins vs Claude Opus 4.8', unit: 'count' }, 'losses vs Claude Opus 4.8': { name: 'Losses vs Claude Opus 4.8', unit: 'count' },
  },
  async fetch() {
    const data = await fetchJson<Stats>(feed);
    if (!data.ok || data.models.length < 4) throw new Error('Incomplete TetrisBench results');
    return data.models.map(id => {
      const { wins, losses, draws, totalGames, winRate } = data.totals[id];
      const metrics: Record<string, number> = { wins, losses, draws };
      for (const [opponent, record] of Object.entries(data.matrix[id])) {
        for (const key of ['wins', 'losses', 'draws'] as const) {
          metrics[key + ' vs ' + (data.modelNames[opponent] || opponent)] = record[key];
        }
      }
      if (![winRate, totalGames, ...Object.values(metrics)].every(Number.isFinite) ||
          totalGames !== wins + losses + draws) throw new Error('Invalid game record for ' + id);
      return { model: data.modelNames[id] || id, score: winRate, trials: totalGames, metrics };
    });
  },
};
export default board;
