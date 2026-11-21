// Legal Benchmarks ranks applications by the percentage of extraction tasks passed. Its page includes form scores alongside the pass rates.
import type { Leaderboard } from './types.ts';
import { applicationRows, applicationsUrl, applicationsTerms } from './legalbenchmarks-contract-workflows-applications.ts';

const board: Leaderboard = {
  benchmark: 'legalbenchmarks-data-extraction-applications',
  url: applicationsUrl, feed: applicationsUrl, terms: applicationsTerms, harnesses: 'system',
  fetch: () => applicationRows('extractionData', 11),
};
export default board;
