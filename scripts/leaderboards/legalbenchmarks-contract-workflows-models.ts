// Legal Benchmarks ranks model runs by task pass rate. The Contract Workflows tab reads the drafting results in the page's Next.js payload.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';

const FEED = "https://www.legalbenchmarks.ai/leaderboard/models";

interface Result {
  name: string; reliability: number; criteriaPassRate?: number; usefulness?: number;
  latencySeconds?: number; costPerTask?: number;
}
export async function legalModels(feed: string, field: string, minimum: number) {
  const records = jsonAfter<Result[]>(nextFlight(await fetchText(feed)), `"${field}":`);
  if (records.length < minimum) throw new Error(`Incomplete ${field} leaderboard`);
  return records.map((r) => {
    if (!r.name || !Number.isFinite(r.reliability)) throw new Error(`Missing task pass rate in ${field}`);
    const metrics: Record<string, number> = {};
    if (r.criteriaPassRate != null) metrics.criteriaPassRate = r.criteriaPassRate;
    if (r.usefulness != null) metrics.form = r.usefulness;
    if (r.latencySeconds != null) metrics.latency = r.latencySeconds;
    return { model: r.name, score: r.reliability, cost: r.costPerTask ?? undefined, metrics };
  });
}

const board: Leaderboard = {
  benchmark: "legalbenchmarks-contract-workflows-models",
  url: "https://www.legalbenchmarks.ai/leaderboard/models",
  feed: FEED,
  terms: "The publisher displays results at https://www.legalbenchmarks.ai/leaderboard/models. I could not verify reuse terms. The site allows all paths in robots.txt.",
  stats: {
    criteriaPassRate: { name: 'Criteria pass rate', unit: '%', better: 'higher' },
    form: { name: 'Form score', unit: '%', better: 'higher' },
    latency: { name: 'Latency', unit: 'seconds', better: 'lower' },
  },
  chart: {
    title: 'Task pass rate vs. form score',
    x: { key: 'score', label: 'Task pass rate', unit: '%', better: 'higher' },
    y: { key: 'form', label: 'Form score', unit: '%', better: 'higher' },
    note: 'LegalBenchmarks plots substance task pass rate on the horizontal axis against form score on the vertical axis.',
  },
  async fetch() {
    return legalModels(FEED, 'draftingData', 27);
  },
};
export default board;
