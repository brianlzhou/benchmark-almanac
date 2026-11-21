// PWS-Decisions tests web-grounded decision APIs on dated public-web facts.
// The headline score is whole-set mean accuracy across 300 questions and three runs.
// The importer reads the benchmark repository's reviewed baseline-summary JSON.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const URL = 'https://github.com/parallel-web/pws-decisions-benchmark';
const FEED = 'https://raw.githubusercontent.com/parallel-web/pws-decisions-benchmark/main/results/baseline-summary.json';
const TERMS = 'The benchmark code is MIT licensed. Aggregate results come from the repository. The gated dataset uses Parallel evaluation terms and a no-redistribution license.';

interface Result {
  label: string;
  model: string;
  public: { mean_accuracy_percent: number; t95_interval_percent: [number, number] };
  whole: { mean_accuracy_percent: number; t95_interval_percent: [number, number] };
  evaluated_dates_pacific: string[];
  latency_p50_s: number;
  latency_p95_s: number;
  cost_usd_per_1000_questions: number;
  run_count: number;
}
interface Summary { results: Result[] }

const board: Leaderboard = {
  benchmark: 'pws-decisions',
  url: URL,
  feed: FEED,
  terms: TERMS,
  parts: {
    publicAccuracy: { name: 'Public Set Accuracy', unit: '%' },
    wholeAccuracy: { name: 'Whole Set Accuracy', unit: '%' },
  },
  fetch: async (): Promise<LeaderboardRow[]> => {
    const data = await fetchJson<Summary>(FEED);
    if (!Array.isArray(data.results) || data.results.length < 5) throw new Error('PWS-Decisions: baseline results missing');
    return data.results.map((result) => {
      const low = result.whole.t95_interval_percent[0];
      const high = result.whole.t95_interval_percent[1];
      return {
        model: result.label,
        score: result.whole.mean_accuracy_percent,
        setting: 'whole set',
        date: result.evaluated_dates_pacific[0],
        low,
        high,
        trials: result.run_count,
        cost: result.cost_usd_per_1000_questions / 1000,
        metrics: {
          publicAccuracy: result.public.mean_accuracy_percent,
          wholeAccuracy: result.whole.mean_accuracy_percent,
          latencyP50: result.latency_p50_s,
          latencyP95: result.latency_p95_s,
          costPer1000: result.cost_usd_per_1000_questions,
        },
      };
    });
  },
};

export default board;
