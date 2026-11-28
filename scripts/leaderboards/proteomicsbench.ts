// ProteomicsBench (LatchBio V1): bottom-up mass spectrometry proteomics agent runs with score, per-run cost, tokens, and turns.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { BIO_ALIASES } from './biosecbench-refusal.ts';

const FEED = 'https://benchmarks.bio/benchmarks/proteomicsbench/latest.json';

interface ProteomicsFeed {
  resultVersion: string;
  dataUpdatedAt?: string;
  results: {
    model: string;
    harness: string;
    scorePct: number;
    avgCost?: number | null;
    avgTokens?: number | null;
    avgTurns?: number | null;
    modelVariant?: string | null;
  }[];
}

const board: Leaderboard = {
  benchmark: 'proteomicsbench',
  harnesses: 'system',
  reference: ['Pi'],
  costPer: 'run',
  url: 'https://benchmarks.bio/proteomicsbench-bottom-up',
  feed: FEED,
  terms: 'Public V1 leaderboard JSON published by LatchBio on benchmarks.bio with citation and open access.',
  aliases: BIO_ALIASES,
  stats: {
    totalTokens: {
      name: 'Total tokens per run',
      unit: 'tokens',
      better: 'lower',
      note: 'Average total tokens consumed across a benchmark run.',
    },
    turns: {
      name: 'Turns per run',
      unit: 'count',
      better: 'lower',
      note: 'Average agent turns per benchmark run.',
    },
  },

  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<ProteomicsFeed>(FEED);
    if (!Array.isArray(data.results) || data.results.length < 10) {
      throw new Error('ProteomicsBench feed returned fewer ranked configurations than expected');
    }
    const date = typeof data.dataUpdatedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.dataUpdatedAt)
      ? data.dataUpdatedAt
      : undefined;

    return data.results
      .filter((r) => Boolean(r.model) && Boolean(r.harness) && Number.isFinite(r.scorePct))
      .map((r) => {
        const metrics: Record<string, number> = {};
        if (typeof r.avgTokens === 'number' && Number.isFinite(r.avgTokens)) {
          metrics.totalTokens = Math.round(r.avgTokens);
        }
        if (typeof r.avgTurns === 'number' && Number.isFinite(r.avgTurns)) {
          metrics.turns = r.avgTurns;
        }
        return {
          model: r.model.replace(/\*$/, '').trim(),
          harness: r.harness,
          setting: r.modelVariant ? r.modelVariant.trim() : undefined,
          score: r.scorePct,
          date,
          cost: typeof r.avgCost === 'number' && Number.isFinite(r.avgCost) ? r.avgCost : undefined,
          metrics: Object.keys(metrics).length ? metrics : undefined,
        };
      });
  },
};

export default board;
