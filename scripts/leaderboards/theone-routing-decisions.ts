// TheOne Routing Decisions publishes a single scored task, theone-routing-decisions, on Kaggle.
// Its leaderboard download includes both fractional accuracy and individual Boolean results.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { kaggleFeed, KAGGLE_TERMS } from './kaggle-game-arena.ts';

const feed = kaggleFeed("yulidai", "theone-routing-decisions");
interface Result {
  resultCase: string;
  booleanResult?: boolean;
  numericResultNullable?: { value: number; hasConfidenceInterval?: boolean; confidenceInterval?: number };
  evaluationDate?: string;
}
interface Entry {
  modelVersionName: string;
  modelVersionConfigName?: string;
  agentName?: string;
  harnessName?: string;
  taskResults: { benchmarkTaskName: string; result: Result }[];
}
const board: Leaderboard = {
  benchmark: "theone-routing-decisions", url: "https://www.kaggle.com/benchmarks/yulidai/theone-routing-decisions", feed, terms: KAGGLE_TERMS,
  aliases: { 'Qwen 3 Next 80B Instruct': 'qwen3-next-80b-a3b-instruct' },
  async fetch() {
    const data = await fetchJson<{ rows: Entry[] }>(feed);
    const rows = data.rows.flatMap(r => {
      const result = r.taskResults.find(t => t.benchmarkTaskName === "theone-routing-decisions")?.result;
      if (!result) throw new Error('Missing Kaggle task');
      if (result.resultCase === 'none') return [];
      const numeric = result.numericResultNullable;
      const value = result.resultCase === 'booleanResult' ? Number(result.booleanResult) : numeric?.value;
      if (!r.modelVersionName || value === undefined || !Number.isFinite(value)) throw new Error('Invalid Kaggle score');
      const ci = numeric?.hasConfidenceInterval ? numeric.confidenceInterval : undefined;
      return [{ model: r.modelVersionName, score: value * 100, setting: r.modelVersionConfigName || undefined,
        harness: [r.agentName, r.harnessName].filter(Boolean).join(', ') || undefined, date: result.evaluationDate?.slice(0, 10),
        ...(ci !== undefined ? { low: (value - ci) * 100, high: (value + ci) * 100 } : {}) }];
    });
    if (rows.length < 2) throw new Error('Incomplete Kaggle leaderboard');
    return rows;
  },
};
export default board;
