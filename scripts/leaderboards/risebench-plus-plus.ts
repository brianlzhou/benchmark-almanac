// RISEBench++ on the VisionXLab RISEBench leaderboard: English results, accuracy total, read through riseRows
// in risebench.ts, which explains the file and the rows left out.
import type { Leaderboard } from './types.ts';
import { RISE_ALIASES, RISE_FEED, RISE_STATS, RISE_TERMS, RISE_URL, riseRows } from './risebench.ts';

const PART_KEYS = ['temporal', 'causal', 'spatial', 'logical', 'counterfactual', 'hybrid', 'single', 'multi'] as const;

const board: Leaderboard = {
  benchmark: 'risebench-plus-plus',
  url: RISE_URL,
  feed: `${RISE_FEED} (risebench-plusplus, en, accuracy.total)`,
  terms: RISE_TERMS,
  parts: {
    temporal: { name: 'Temporal', group: 'Category', unit: '%' },
    causal: { name: 'Causal', group: 'Category', unit: '%' },
    spatial: { name: 'Spatial', group: 'Category', unit: '%' },
    logical: { name: 'Logical', group: 'Category', unit: '%' },
    counterfactual: { name: 'Counterfactual', group: 'Category', unit: '%' },
    hybrid: { name: 'Hybrid', group: 'Category', unit: '%' },
    single: { name: 'Single-image', group: 'Input', unit: '%' },
    multi: { name: 'Multi-image', group: 'Input', unit: '%' },
  },
  stats: RISE_STATS,
  aliases: RISE_ALIASES,
  fetch: () => riseRows('risebench-plusplus', PART_KEYS),
};
export default board;
