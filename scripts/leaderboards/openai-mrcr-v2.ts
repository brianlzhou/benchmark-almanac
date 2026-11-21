// OpenAI MRCR v2 (8-needle) on Context Arena, which runs the test itself. The feed splits each model's run into
// context-length bins. The score is the 128K to 256K bin's mean string-similarity score, times 100: the bin OpenAI
// reports most often. Context Arena's overall score is not used, because it averages only the bins a model was
// run on, and models stop at different lengths. Keep the other bins and their sample counts as diagnostics. Models not run at 128K or more have no row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

type Bin = { avg_score: number; sample_count: number };
type Entry = { model_slug: string; reasoning_mode?: string; overall_score?: number; total_samples?: number; bins: Record<string, Bin> };

const FEED = 'https://contextarena.ai/api/leaderboard?needles=8&mode=full';
const BIN = 'in_(131072,262144)';

const board: Leaderboard = {
  benchmark: 'openai-mrcr-v2',
  host: 'Context Arena',
  url: 'https://contextarena.ai/?needles=8&mode=full&showExtra=true',
  feed: `${FEED} (bin ${BIN})`,
  terms: 'Context Arena publishes this independently run leaderboard and its API feed. The almanac credits and links Context Arena.',
  stats: { samples: { name: 'Bin samples', unit: 'count' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<{ needles: number; mode: string; leaderboard: Entry[] }>(FEED);
    if (data.needles !== 8 || data.mode !== 'full') throw new Error('Context Arena MRCR feed is not the 8-needle full board');
    const rows = data.leaderboard.flatMap((r) => {
      const bin = r.bins?.[BIN];
      if (!bin) return [];
      const setting = `8-needle, 128K to 256K bin${r.reasoning_mode ? `, ${r.reasoning_mode} reasoning` : ''}`;
      const metrics: Record<string, number> = { samples: bin.sample_count };
      if (typeof r.overall_score === 'number') metrics.allBins = 100 * r.overall_score;
      if (typeof r.total_samples === 'number') metrics.allBinSamples = r.total_samples;
      for (const [range, other] of Object.entries(r.bins)) {
        if (range === BIN) continue;
        if (Number.isFinite(other.avg_score)) metrics[range] = 100 * other.avg_score;
        if (Number.isFinite(other.sample_count)) metrics[range + ' samples'] = other.sample_count;
      }
      return [{ model: r.model_slug, score: bin.avg_score * 100, setting, metrics }];
    });
    if (rows.length < 50) throw new Error(`Context Arena MRCR feed returned only ${rows.length} rows with the 128K to 256K bin`);
    for (const r of rows) if (!r.model || !Number.isFinite(r.score) || r.score < 0 || r.score > 100) throw new Error('Invalid Context Arena MRCR row');
    return rows;
  },
};
export default board;
