// Stanford Cars evaluates fine-grained vehicle classification across 196 make, model, and year classes.
// This importer reads the live MIEB English benchmark API from the MTEB leaderboard backend,
// reporting linear-probe classification accuracy in percent along with zero-shot accuracy and model metadata.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MIEB%28eng%29/scores';

type MiebRow = {
  model: { name: string; openWeights?: boolean | null; license?: string | null; memoryUsageMb?: number | null };
  scoresByTask?: Record<string, number | null>;
  activeParamsB?: number | null;
  totalParamsB?: number | null;
  embeddingDim?: number | null;
  maxTokens?: number | null;
};

const board: Leaderboard = {
  benchmark: 'stanford-cars',
  host: 'MIEB',
  url: 'https://huggingface.co/spaces/mteb/leaderboard',
  feed: FEED,
  terms: 'Public MTEB and MIEB leaderboard API. Scores remain credited to MIEB and the Stanford Cars authors.',
  headline: 'Headline is Stanford Cars linear-probe classification accuracy in percent from MIEB.',
  parts: {
    zeroShot: { name: 'Zero-shot classification', group: 'Evaluation mode', unit: '%', better: 'higher' },
  },
  stats: {
    embeddingDim: { name: 'Embedding dimensions', unit: 'count' },
    maxTokens: { name: 'Maximum tokens', unit: 'tokens' },
    activeParamsB: { name: 'Active parameters', unit: 'billions' },
    memoryGb: { name: 'Memory usage', unit: 'gb', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<{ benchmarkName: string; rows: MiebRow[] }>(FEED);
    if (data.benchmarkName !== 'MIEB(eng)') throw new Error(`MIEB suite changed: ${data.benchmarkName}`);

    const rows: LeaderboardRow[] = [];
    for (const r of data.rows) {
      const acc = r.scoresByTask?.StanfordCars;
      if (typeof acc !== 'number' || !Number.isFinite(acc)) continue;

      const metrics: Record<string, number> = {};
      if (typeof r.scoresByTask?.StanfordCarsZeroShot === 'number') {
        metrics.zeroShot = Number((r.scoresByTask.StanfordCarsZeroShot * 100).toFixed(2));
      }
      if (typeof r.embeddingDim === 'number') metrics.embeddingDim = r.embeddingDim;
      if (typeof r.maxTokens === 'number') metrics.maxTokens = r.maxTokens;
      if (typeof r.activeParamsB === 'number' && r.activeParamsB > 0) metrics.activeParamsB = r.activeParamsB;
      if (typeof r.model.memoryUsageMb === 'number' && r.model.memoryUsageMb > 0) {
        metrics.memoryGb = Number((r.model.memoryUsageMb / 1024).toFixed(2));
      }

      rows.push({
        model: r.model.name,
        score: Number((acc * 100).toFixed(2)),
        ...(Object.keys(metrics).length ? { metrics } : {}),
        ...(typeof r.totalParamsB === 'number' && r.totalParamsB > 0 ? { params: r.totalParamsB } : {}),
        ...(typeof r.model.openWeights === 'boolean' ? { open: r.model.openWeights } : {}),
        ...(r.model.license ? { license: r.model.license } : {}),
      });
    }

    if (rows.length < 20) throw new Error(`Stanford Cars MIEB returned too few rows: ${rows.length}`);
    return rows;
  },
};

export default board;
