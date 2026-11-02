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
  cost?: { mean_usd_per_attempt?: number };
}

const board: Leaderboard = {
  benchmark: 'rcm-bench-1',
  url: PAGE,
  feed: `${FEED} (weightedScore)`,
  terms: 'Results JSON that Commure links for download from the benchmark page; eng.commure.com serves no robots.txt and states no terms for it.',
  async fetch() {
    const data = await fetchJson<{ runs: Run[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data.runs ?? []) {
      if (!r.name || !Number.isFinite(r.weightedScore)) continue;
      const effort = r.reasoning && /^(none|minimal|low|medium|high|xhigh|max)\b/i.test(r.reasoning) ? r.reasoning.split(/\s/)[0].toLowerCase() : undefined;
      rows.push({
        model: r.name,
        score: Number(r.weightedScore.toFixed(2)),
        setting: effort,
        date: r.date,
        cost: r.cost?.mean_usd_per_attempt,
      });
    }
    if (rows.length < 10) throw new Error(`only ${rows.length} RCM-Bench rows`);
    return rows;
  },
};
export default board;
