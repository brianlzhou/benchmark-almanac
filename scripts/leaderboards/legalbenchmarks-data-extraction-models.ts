// Legal Benchmarks ranks data extraction models by task pass rate. The extraction tab in the board's page payload also supplies criteria pass rate, form, latency and cost.
import type { Leaderboard } from './types.ts';
import { legalModels } from './legalbenchmarks-contract-workflows-models.ts';

const FEED = "https://www.legalbenchmarks.ai/leaderboard/models";

const board: Leaderboard = {
  benchmark: "legalbenchmarks-data-extraction-models",
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
    return legalModels(FEED, 'extractionData', 27);
  },
};
export default board;
