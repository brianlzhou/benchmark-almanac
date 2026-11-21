// Include workflow pass rates, trial counts, pricing coverage and published token rates.
// RCM-Bench-1 (Commure). The benchmark page links its results as JSON ("Download results JSON",
// /benchmarks/rcm-bench-1/results.json): one run per model with weightedScore (outcomes averaged per case,
// cases per workflow, then the six workflows weighted equally, 0 to 100; the page's "Overall weighted
// score"), the reasoning setting, the run date and an estimated cost with mean_usd_per_attempt. The score is
// weightedScore; cost per task is the mean estimated cost of one attempt.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://eng.commure.com/benchmarks/rcm-bench-1';
const FEED = `${PAGE}/results.json`;

interface Run {
  name: string;
  reasoning?: string;
  date?: string;
  weightedScore: number;
  cases: number;
  flowCases: number[];
  passed: number[];
  totalTrials: number;
  passedTrials: number;
  engineCompletedTrials?: number;
  agentErrors?: number;
  cost?: {currency?: string; mean_usd_per_attempt?: number; estimated_usd?: number; priced_attempts_subtotal_usd?: number;
    priced_attempts?: number; rates_per_million?: {input?: number; output?: number; cachedInput?: number}};

}

const board: Leaderboard = {
  benchmark: 'rcm-bench-1',
  url: PAGE,
  feed: `${FEED} (weightedScore)`,
  terms: 'Results JSON that Commure links for download from the benchmark page; eng.commure.com serves no robots.txt and states no terms for it.',
  async fetch() {
    const data = await fetchJson<{ runs: Run[]; trialsPerCase: number; flows: { id: string; label: string }[] }>(FEED);
    const flows = data.flows.map(flow => ({key: flow.id.replace(/_(.)/g, (_, c: string) => c.toUpperCase()), name: flow.label}));
    board.parts = Object.fromEntries(flows.map(f => [f.key, {name: f.name, group: 'Workflow'}]));
    const rows: LeaderboardRow[] = [];
    for (const r of data.runs ?? []) {
      if (!r.name || !Number.isFinite(r.weightedScore)) continue;
      const effort = r.reasoning && /^(none|minimal|low|medium|high|xhigh|max)\b/i.test(r.reasoning) ? r.reasoning.split(/\s/)[0].toLowerCase() : undefined;
      const metrics: Record<string, number> = {};
      for (const [i, flow] of flows.entries()) {
        const attempts = r.flowCases[i] * data.trialsPerCase;
        if (attempts > 0 && Number.isFinite(r.passed[i])) metrics[flow.key] = 100 * r.passed[i] / attempts;
      }
      const cost = r.cost?.currency === 'USD' ? r.cost : undefined;
      for (const [key, value] of Object.entries({
        cases: r.cases, totalTrials: r.totalTrials, passedTrials: r.passedTrials, engineCompletedTrials: r.engineCompletedTrials,
        agentErrors: r.agentErrors, priceIn: cost?.rates_per_million?.input, priceOut: cost?.rates_per_million?.output,
        priceCachedIn: cost?.rates_per_million?.cachedInput, estimatedRunCost: cost?.estimated_usd,
        pricedSubtotal: cost?.priced_attempts_subtotal_usd, pricedAttempts: cost?.priced_attempts,
      })) if (typeof value === 'number') metrics[key] = value;
      rows.push({
        model: r.name,
        score: Number(r.weightedScore.toFixed(2)),
        setting: effort ?? r.reasoning,
        trials: data.trialsPerCase, metrics,
        date: r.date,
        cost: cost?.mean_usd_per_attempt,
      });
    }
    if (rows.length < 10) throw new Error(`only ${rows.length} RCM-Bench rows`);
    return rows;
  },
};
export default board;
