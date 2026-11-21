// Kaggle ranks models by their overall ICML expert task score. Its leaderboard download includes the overall percentage and individual task outcomes.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://www.kaggle.com/api/v1/benchmarks/kaggle/icml-2025-experts/leaderboard";
interface Result { resultCase: string; booleanResult?: boolean; numericResult?: { value: number; hasConfidenceInterval?: boolean; confidenceInterval?: number }; evaluationDate?: string }
interface Entry { modelVersionSlug: string; modelVersionName: string; modelVersionConfigName?: string; agentName?: string; harnessName?: string; taskResults: { benchmarkTaskName: string; benchmarkTaskSlug: string; result: Result }[] }
export async function kaggleExpertTasks(feed: string, minimum: number, board: Leaderboard) {
  const { rows } = await fetchJson<{ rows: Entry[] }>(feed);
  if (rows.length < minimum) throw new Error('Incomplete Kaggle standings');
  const parts: Record<string, string> = {};
  const entries = rows.flatMap(r => {
    const aggregate = r.taskResults.find(t => !t.benchmarkTaskSlug && (!t.benchmarkTaskName || t.benchmarkTaskName === '(Overall)'))?.result;
    if (!aggregate) throw new Error('Missing overall Kaggle column');
    if (aggregate.resultCase === 'none') return [];
    const value = aggregate.numericResult, score = value?.value;
    const model = r.modelVersionName || r.modelVersionSlug;
    if (score == null || !Number.isFinite(score) || !model) throw new Error('Missing numeric overall result');
    const metrics: Record<string, number> = {};
    for (const t of r.taskResults.filter(t => t.benchmarkTaskSlug)) {
      const key = t.benchmarkTaskSlug;
      if (t.result.resultCase === 'booleanResult') { metrics[key] = Number(t.result.booleanResult) * 100; parts[key] = t.benchmarkTaskName; }
      else if (t.result.resultCase === 'numericResult' && t.result.numericResult) { metrics[key] = t.result.numericResult.value; parts[key] = t.benchmarkTaskName; }
    }
    const ci = value?.hasConfidenceInterval ? value.confidenceInterval : undefined;
    return [{ model, score, setting: r.modelVersionConfigName || undefined,
      harness: [r.agentName, r.harnessName].filter(Boolean).join(' / ') || undefined, date: aggregate.evaluationDate?.slice(0, 10),
      ...(ci == null ? {} : { low: score - ci, high: score + ci }), metrics }];
  });
  board.parts = parts;
  if (entries.length < minimum) throw new Error('Missing scored Kaggle entries');
  return entries;
}

const board: Leaderboard = {
  benchmark: "kaggle-icml-2025-experts",
  url: "https://www.kaggle.com/benchmarks/kaggle/icml-2025-experts",
  feed: FEED,
  terms: "Kaggle documents its public download endpoint at https://www.kaggle.com/docs/benchmarks. Kaggle terms apply at https://www.kaggle.com/terms. The robots URL returns HTML.",
  async fetch() {
    return kaggleExpertTasks(FEED, 6, board);
  },
};
export default board;
