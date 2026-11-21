// BRIGHT-Pro ranks retrievers across seven domains. MTEB displays mean retrieval score on a 0 to 100 scale.
// Read the benchmark scores endpoint used by the MTEB leaderboard.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = "https://leaderboard.mteb.org/benchmark/BRIGHT-Pro";
const feed = "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/BRIGHT-Pro/scores";
type Result = { model: { name: string, openWeights: boolean | null, license: string | null },
  meanTaskType: number, scoresByTask: Record<string, number | null>, totalParamsB: number | null,
  zeroShotPct: number | null, embeddingDim: number | null, activeParamsB: number | null, maxTokens: number | null };
const board: Leaderboard = {
  benchmark: 'bright-pro', url, feed,
  terms: "MTEB publishes its results under CC0 1.0. The leaderboard and API allow crawling in robots.txt.",
  parts: {},
  async fetch() {
    const d = await fetchJson<{ benchmarkName: string, tasks: string[], rows: Result[] }>(feed);
    if (d.benchmarkName !== 'BRIGHT-Pro' || d.tasks.length < 7 || d.rows.length < 20) throw new Error('Incomplete BRIGHT-Pro ranking');
    for (const task of d.tasks) board.parts![task] = { name: task, group: 'Task' };
    return d.rows.map(r => {
      if (!r.model.name || !Number.isFinite(r.meanTaskType)) throw new Error('Invalid BRIGHT-Pro result');
      const metrics: Record<string, number> = {};
      for (const task of d.tasks) {
        if (!(task in r.scoresByTask)) throw new Error('Missing task column: ' + task);
        const score = r.scoresByTask[task];
        if (score !== null) metrics[task] = score * 100;
      }
      for (const k of ['zeroShotPct', 'embeddingDim', 'activeParamsB', 'maxTokens'] as const) {
        if (typeof r[k] === 'number') metrics[k] = r[k];
      }
      return { model: r.model.name, score: r.meanTaskType * 100, open: r.model.openWeights ?? undefined,
        params: r.totalParamsB ?? undefined, license: r.model.license ?? undefined, metrics };
    });
  },
};
export default board;
