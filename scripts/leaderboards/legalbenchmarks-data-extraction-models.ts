// Legal Benchmarks ranks data extraction models by task pass rate. The extraction tab in the board's page payload also supplies criteria pass rate, form, latency and cost.
import type { Leaderboard } from './types.ts';
import { legalModels } from './legalbenchmarks-contract-workflows-models.ts';

const FEED = "https://www.legalbenchmarks.ai/leaderboard/models";

const board: Leaderboard = {
  benchmark: "legalbenchmarks-data-extraction-models",
  url: "https://www.legalbenchmarks.ai/leaderboard/models",
  feed: FEED,
  terms: "The publisher displays results at https://www.legalbenchmarks.ai/leaderboard/models. I could not verify reuse terms. The site allows all paths in robots.txt.",
  async fetch() {
    return legalModels(FEED, 'extractionData', 27);
  },
};
export default board;
