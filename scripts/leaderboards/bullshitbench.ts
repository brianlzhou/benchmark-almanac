// BullshitBench V1. The V1 question set's leaderboard.csv under data/latest/ on the BullshitBench site, read
// with the V2 reader in bullshitbench-2.ts: clear pushback rate with refusals excluded, as the viewer ranks.
// The V1 viewer rows supply clear pushback by technique and usage per answer.
import type { Leaderboard } from './types.ts';
import { BS_ALIASES, BS_PAGE, BS_STATS, BS_TERMS, bsRows } from './bullshitbench-2.ts';

const board: Leaderboard = {
  benchmark: 'bullshitbench',
  url: BS_PAGE,
  feed: `${BS_PAGE}data/latest/leaderboard.csv (clear pushback, refusals excluded) and viewer_rows (cost, output tokens)`,
  terms: BS_TERMS,
  parts: {
    authoritative_framing_of_nothing: { name: 'Authoritative framing of nothing', group: 'Technique' },
    causal_chimera: { name: 'Causal chimera', group: 'Technique' },
    cross_domain_concept_stitching: { name: 'Cross domain concept stitching', group: 'Technique' },
    false_granularity: { name: 'False granularity', group: 'Technique' },
    inverted_nonexistent_dependency: { name: 'Inverted nonexistent dependency', group: 'Technique' },
    misapplied_mechanism: { name: 'Misapplied mechanism', group: 'Technique' },
    plausible_nonexistent_framework: { name: 'Plausible nonexistent framework', group: 'Technique' },
    reified_metaphor: { name: 'Reified metaphor', group: 'Technique' },
    temporal_category_error: { name: 'Temporal category error', group: 'Technique' },
    wrong_unit_of_analysis: { name: 'Wrong unit of analysis', group: 'Technique' },
  },
  stats: {
    ...BS_STATS,
    errors: { name: 'Errors', unit: 'count', better: 'lower' },
  },
  aliases: BS_ALIASES,
  fetch: () => bsRows('data/latest/', true, true),
};
export default board;
