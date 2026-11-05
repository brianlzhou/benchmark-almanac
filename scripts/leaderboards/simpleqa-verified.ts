// SimpleQA Verified on Kaggle Benchmarks (run by Google DeepMind). Kaggle documents a public JSON
// endpoint for each benchmark's leaderboard (kaggle.com/docs/benchmarks); the single task's numeric
// result is the headline, a fraction shown as a percentage. Its confidence interval (the "±", a fraction) is
// kept as the bounds `ciLow` and `ciHigh` (0 to 100), like kaggleRows in kaggle-game-arena.ts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://www.kaggle.com/api/v1/benchmarks/deepmind/simpleqa-verified/leaderboard';

interface Row {
  modelVersionName?: string;
  modelVersionSlug?: string;
  modelVersionConfigName?: string;
  agentName?: string;
  harnessName?: string;
  taskResults: {
    benchmarkTaskSlug?: string;
    result?: { numericResult?: { value?: number; hasConfidenceInterval?: boolean; confidenceInterval?: number }; evaluationDate?: string };
  }[];
}

const board: Leaderboard = {
  benchmark: 'simpleqa-verified',
  url: 'https://www.kaggle.com/benchmarks/deepmind/simpleqa-verified',
  feed: FEED,
  terms: "Kaggle's documented public leaderboard download endpoint; Kaggle's terms of use apply.",
  aliases: {
    // Kaggle's slug for this row is gpt-3.5-turbo-1106
    'GPT-3.5 Turbo': 'gpt-3-5-turbo-nov-2023',
  },
  async fetch() {
    const { rows } = await fetchJson<{ rows: Row[] }>(FEED);
    const out: LeaderboardRow[] = [];
    for (const r of rows) {
      const res = r.taskResults.find((t) => t.benchmarkTaskSlug?.includes('simpleqa-verified'))?.result;
      const value = res?.numericResult?.value;
      if (value == null) continue;
      const ci = res?.numericResult?.hasConfidenceInterval ? res.numericResult.confidenceInterval : undefined;
      out.push({
        model: r.modelVersionName?.trim() || r.modelVersionSlug || '',
        score: value * 100,
        setting: r.modelVersionConfigName || undefined,
        harness: [r.agentName, r.harnessName].filter(Boolean).join(', ') || undefined,
        date: res?.evaluationDate?.slice(0, 10),
        ...(ci ? { metrics: { ciLow: (value - ci) * 100, ciHigh: (value + ci) * 100 } } : {}),
      });
    }
    return out;
  },
};
export default board;
