// PCT (Polarized Contrastive Pairs) on the CAIS AI Dashboard. The dashboard's PCT column is political
// inconsistency (lower is better): the mean of sentiment inconsistency and helpfulness inconsistency
// (pct_detail), stored as scores.pct in the page's model data. That number is the score. The reader is shared
// with cais-text-capabilities-index.ts.
import type { Leaderboard } from './types.ts';
import { CAIS_ALIASES, CAIS_PAGE, CAIS_TERMS, caisIndexRows } from './cais-text-capabilities-index.ts';

const board: Leaderboard = {
  benchmark: 'pct-political-consistency',
  url: CAIS_PAGE,
  feed: `${CAIS_PAGE} (page JS chunk, scores.pct, political inconsistency)`,
  terms: CAIS_TERMS,
  aliases: CAIS_ALIASES,
  fetch: () => caisIndexRows(['pct']),
};
export default board;
