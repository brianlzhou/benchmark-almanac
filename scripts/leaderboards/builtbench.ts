// BuiltBench evaluates text embedding models on architectural and built-asset retrieval, clustering, and reranking.
// Read the BuiltBench(eng) benchmark scores endpoint used by the MTEB leaderboard.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = 'https://huggingface.co/spaces/mteb/leaderboard';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/benchmarks/BuiltBench%28eng%29/scores';
type Result = {
  model: { name: string; openWeights: boolean | null; license: string | null };
  meanTask: number | null;
  meanTaskType: number | null;
  scoresByTask: Record<string, number | null>;
  totalParamsB: number | null;
};

const board: Leaderboard = {
  benchmark: 'builtbench',
  url,
  feed,
  host: 'MTEB',
  terms: 'MTEB publishes the scores at https://huggingface.co/datasets/mteb/results under CC0 1.0.',
  stats: {
    meanTaskType: { name: 'Mean task-type score', unit: 'score', better: 'higher' },
  },
  parts: {
    BuiltBenchRetrieval: { name: 'Retrieval', group: 'Task' },
    BuiltBenchClusteringS2S: { name: 'Clustering S2S', group: 'Task' },
    BuiltBenchClusteringP2P: { name: 'Clustering P2P', group: 'Task' },
    BuiltBenchReranking: { name: 'Reranking', group: 'Task' },
  },
  async fetch() {
    const d = await fetchJson<{ benchmarkName: string; tasks: string[]; rows: Result[] }>(feed);
    if (d.benchmarkName !== 'BuiltBench(eng)' || d.tasks.length < 4 || d.rows.length < 50) {
      throw new Error('Incomplete BuiltBench ranking');
    }
    const rows = d.rows
      .filter((r): r is Result & { meanTask: number } => typeof r.meanTask === 'number' && Number.isFinite(r.meanTask))
      .map(r => {
        if (!r.model.name) throw new Error('Invalid BuiltBench model');
        const metrics: Record<string, number> = {};
        if (typeof r.meanTaskType === 'number' && Number.isFinite(r.meanTaskType)) metrics.meanTaskType = r.meanTaskType * 100;
        for (const task of d.tasks) {
          const score = r.scoresByTask[task];
          if (typeof score === 'number' && Number.isFinite(score)) metrics[task] = score * 100;
        }
        return {
          model: r.model.name,
          score: r.meanTask * 100,
          open: r.model.openWeights ?? undefined,
          params: r.totalParamsB ?? undefined,
          license: r.model.license ?? undefined,
          metrics,
        };
      });
    if (rows.length < 50) throw new Error('Too few BuiltBench rows');
    return rows;
  },
};
export default board;
