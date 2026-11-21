// Arena Expert is the expert-prompt subset of Arena's pairwise model evaluations.
// The importer reads the published battle records and computes Bradley-Terry ratings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { arenaFeed } from './lmarena-elo.ts';
import { fetchBytes } from '../lib/util.ts';
import { parquetReadObjects } from 'hyparquet';

const FEED = 'https://huggingface.co/datasets/lmarena-ai/arena-expert-5k/resolve/main/data/train-00000-of-00001.parquet';
const board: Leaderboard = {
  benchmark: 'arena-expert', url: 'https://arena.ai/leaderboard/chat/text/expert', feed: FEED,
  terms: 'Hugging Face publishes the Arena Expert battle dataset under its provider terms. Results are credited to Arena.',
  static: 'paper', headline: 'Bradley-Terry ratings computed from the 5,128 expert prompt battles in the published dataset.',
  stats: {
    battles: { name: 'Battles', unit: 'count' },
  },
  async fetch() {
    const rows = await parquetReadObjects({ file: await fetchBytes(FEED) }) as any[];
    const counts = new Map<string, number>();
    for (const r of rows) for (const m of [r.model_a, r.model_b]) if (m && m !== 'model') counts.set(m, (counts.get(m) ?? 0) + 1);
    if (rows.length < 5000 || counts.size < 10) throw new Error('Arena Expert battle dataset is incomplete');
    const models = [...counts.keys()]; const rating = new Map(models.map(m => [m, 1000]));
    for (let pass = 0; pass < 30; pass++) for (const r of rows) {
      const a = rating.get(r.model_a), b = rating.get(r.model_b); if (a === undefined || b === undefined) continue;
      const winner = r.winner === 'model_a' ? 1 : r.winner === 'model_b' ? 0 : 0.5;
      const expected = 1 / (1 + 10 ** ((b - a) / 400)); const delta = 16 * (winner - expected);
      rating.set(r.model_a, a + delta); rating.set(r.model_b, b - delta);
    }
    return [...rating.entries()].filter(([model]) => (counts.get(model) ?? 0) >= 10).map(([model, score]) => ({ model, score: Math.round(score * 10) / 10, metrics: { battles: counts.get(model)! } } satisfies LeaderboardRow));
  },
};
export default board;
