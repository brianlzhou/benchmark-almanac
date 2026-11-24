// T2Ranking (T2Reranking) evaluates Chinese passage reranking by query relevance.
// This importer reads the live MTEB Chinese v1 leaderboard backend for T2Reranking mean average
// precision on the native 0 to 1 score scale, along with model parameter counts, open-weights flags,
// licenses, embedding dimensions, token limits, and memory footprint.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MTEB%28cmn%2C%20v1%29/scores';

type MtebRow = {
  model: { name: string; openWeights?: boolean | null; license?: string | null; memoryUsageMb?: number | null };
  scoresByTask?: Record<string, number | null>;
  activeParamsB?: number | null;
  totalParamsB?: number | null;
  embeddingDim?: number | null;
  maxTokens?: number | null;
};

const AMBIGUOUS = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i;

const board: Leaderboard = {
  benchmark: 't2ranking',
  host: 'MTEB',
  url: 'https://huggingface.co/spaces/mteb/leaderboard',
  feed: FEED,
  terms: 'Public MTEB leaderboard API. Scores remain credited to MTEB and the T2Ranking authors.',
  headline: 'Headline is T2Reranking mean average precision on the 0 to 1 score scale from MTEB Chinese v1.',
  notModels: /^mteb\/baseline-/i,
  stats: {
    embeddingDim: { name: 'Embedding dimensions', unit: 'count' },
    maxTokens: { name: 'Maximum tokens', unit: 'tokens' },
    activeParamsB: { name: 'Active parameters', unit: 'billions' },
    memoryGb: { name: 'Memory usage', unit: 'gb', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<{ benchmarkName: string; rows: MtebRow[] }>(FEED);
    if (data.benchmarkName !== 'MTEB(cmn, v1)') throw new Error(`MTEB suite changed: ${data.benchmarkName}`);

    const rows: LeaderboardRow[] = [];
    for (const r of data.rows) {
      const score = r.scoresByTask?.T2Reranking;
      if (typeof score !== 'number' || !Number.isFinite(score)) continue;

      const bare = r.model.name.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
      const model = /^facebook\/SONAR$/i.test(r.model.name)
        ? 'facebook/SONAR (Meta embedding)'
        : AMBIGUOUS.test(bare)
          ? `${r.model.name} (snapshot unspecified)`
          : r.model.name;

      const metrics: Record<string, number> = {};
      if (typeof r.embeddingDim === 'number') metrics.embeddingDim = r.embeddingDim;
      if (typeof r.maxTokens === 'number') metrics.maxTokens = r.maxTokens;
      if (typeof r.activeParamsB === 'number' && r.activeParamsB > 0) metrics.activeParamsB = r.activeParamsB;
      if (typeof r.model.memoryUsageMb === 'number' && r.model.memoryUsageMb > 0) {
        metrics.memoryGb = Number((r.model.memoryUsageMb / 1024).toFixed(2));
      }

      rows.push({
        model,
        score: Number(score.toFixed(4)),
        ...(Object.keys(metrics).length ? { metrics } : {}),
        ...(typeof r.totalParamsB === 'number' && r.totalParamsB > 0 ? { params: r.totalParamsB } : {}),
        ...(typeof r.model.openWeights === 'boolean' ? { open: r.model.openWeights } : {}),
        ...(r.model.license ? { license: r.model.license } : {}),
      });
    }

    if (rows.length < 50) throw new Error(`T2Ranking returned too few rows: ${rows.length}`);
    return rows;
  },
};

export default board;
