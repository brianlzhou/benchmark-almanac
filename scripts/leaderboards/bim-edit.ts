// BIM-Edit ranks models by their mean task score. Read ONESTRUCTION's published ranking table.
import type { Leaderboard } from './types.ts';
import { constructionRows, constructionTerms } from './aec-bench-nomic.ts';

const board: Leaderboard = {
  benchmark: 'bim-edit',
  url: 'https://ai.onestruction.com/leaderboard/en/benchmarks/bim/',
  feed: 'https://ai.onestruction.com/leaderboard/en/benchmarks/bim/',
  terms: constructionTerms,
  stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  chart: { title: 'Score versus cost', x: { key: 'cost', label: 'Cost per task', unit: '$', better: 'lower', log: true }, y: { key: 'score', label: 'Mean task score', unit: '%', better: 'higher' } },
  host: 'ONESTRUCTION',
  reference: ['pi'],
  fetch() { return constructionRows(this.url); },
};
export default board;
