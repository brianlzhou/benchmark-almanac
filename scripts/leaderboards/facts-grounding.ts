// FACTS Grounding on Kaggle Benchmarks (run by Google DeepMind), read through Kaggle's documented public
// leaderboard endpoint (kaggle.com/docs/benchmarks), as simpleqa-verified.ts does. The board's tasks are
// "Score" (the headline, a fraction shown as a percentage), "Public Score" and "Private Score". Kaggle now
// runs FACTS Grounding v2 (new judges), so its numbers sit below the v1 scores in older model cards. The
// FACTS suite board (google/facts) averages four tasks and is not this benchmark.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://www.kaggle.com/api/v1/benchmarks/google/facts-grounding/leaderboard';

interface Value {
  value?: number;
}
interface Row {
  modelVersionName?: string;
  modelVersionSlug?: string;
  modelVersionConfigName?: string;
  agentName?: string;
  harnessName?: string;
  taskResults: { benchmarkTaskName?: string; result?: { numericResult?: Value; numericResultNullable?: Value; evaluationDate?: string } }[];
}

const board: Leaderboard = {
  benchmark: 'facts-grounding',
  url: 'https://www.kaggle.com/benchmarks/google/facts-grounding',
  feed: FEED,
  terms: "Kaggle's documented public leaderboard download endpoint; Kaggle's terms of use apply.",
  aliases: {
    'Gemini 3.1 Pro Preview': 'gemini-3-1-pro',
  },
  async fetch() {
    const { rows } = await fetchJson<{ rows: Row[] }>(FEED);
    const out: LeaderboardRow[] = [];
    for (const r of rows) {
      const res = r.taskResults.find((t) => t.benchmarkTaskName === 'Score')?.result;
      const value = res?.numericResultNullable?.value ?? res?.numericResult?.value;
      if (value == null) continue;
      out.push({
        model: r.modelVersionName?.trim() || r.modelVersionSlug || '',
        score: value * 100,
        setting: r.modelVersionConfigName || undefined,
        harness: [r.agentName, r.harnessName].filter(Boolean).join(', ') || undefined,
        date: res?.evaluationDate?.slice(0, 10),
      });
    }
    return out;
  },
};
export default board;
