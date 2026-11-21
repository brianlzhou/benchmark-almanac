// BIM-Edit ranks models by their mean task score. Read ONESTRUCTION's published ranking table.
import type { Leaderboard } from './types.ts';
import { constructionRows, constructionTerms } from './aec-bench-nomic.ts';

const board: Leaderboard = {
  benchmark: 'bim-edit',
  url: 'https://ai.onestruction.com/leaderboard/en/benchmarks/bim/',
  feed: 'https://ai.onestruction.com/leaderboard/en/benchmarks/bim/',
  terms: constructionTerms,
  host: 'ONESTRUCTION',
  reference: ['pi'],
  fetch() { return constructionRows(this.url); },
};
export default board;
