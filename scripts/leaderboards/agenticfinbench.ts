// AgenticFinBench ranks financial agents by audited mean quality Q. The manuscript results file provides the model, harness, uncertainty and operating costs.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://nashnovaresearch.github.io/AgenticFinBench/paper-results.30d929f4706ec459.json";
interface Entry {
  model: string; harness: string; q: number; ci: [number, number]; baseline: number; delta: number;
  claims: number; count: number; response_hallucination: number; claim_hallucination: number;
  baseline_rank: number; time_minutes: number; cost_usd: number;
}

const board: Leaderboard = {
  benchmark: "agenticfinbench",
  url: "https://nashnovaresearch.github.io/AgenticFinBench/#leaderboard",
  feed: FEED,
  terms: "The authors do not specify separate terms for leaderboard scores on https://nashnovaresearch.github.io/AgenticFinBench/#leaderboard",
  stats: {
    latency: { name: 'Time per run', unit: 'seconds', better: 'lower' }, baseline: { name: 'Baseline quality', unit: '%', better: 'higher' }, delta: { name: 'Difference from baseline', unit: '%', better: 'higher' }, baselineRank: { name: 'Baseline rank', unit: 'count' }, claims: { name: 'Claims', unit: 'count' }, questions: { name: 'Questions', unit: 'count' }, responseHallucination: { name: 'Response hallucination rate', unit: '%', better: 'lower' }, claimHallucination: { name: 'Claim hallucination rate', unit: '%', better: 'lower' },
  },
  async fetch() {
    const data = await fetchJson<{ models: Entry[]; configuration_count: number }>(FEED);
    if (data.models.length < 18 || data.models.length !== data.configuration_count) throw new Error('Incomplete manuscript results');
    return data.models.map(r => {
      if (!r.model || !r.harness || ![r.q, ...r.ci, r.cost_usd, r.time_minutes].every(Number.isFinite) || r.ci.length !== 2)
        throw new Error('Incomplete financial agent result');
      return { model: r.model, harness: r.harness, score: r.q, low: r.ci[0], high: r.ci[1], cost: r.cost_usd,
        metrics: { latency: r.time_minutes * 60, baseline: r.baseline, delta: r.delta, baselineRank: r.baseline_rank,
          claims: r.claims, questions: r.count, responseHallucination: r.response_hallucination, claimHallucination: r.claim_hallucination } };
    });
  },
};
export default board;
