// CAIS Risk Index on the CAIS AI Dashboard (lower is better): the mean of seven safety measures as the
// dashboard table computes it in the browser. Agent Red Teaming (art), PCT (pct), HLE miscalibration
// (hle_calibration_error), MACHIAVELLI (machiavelli) and TextQuests Harm (textquests_harm) count as stored;
// MASK honesty (masks) and the VCT, HPCT and BioTIER refusal average (refusal_avg) count as 100 minus the
// score, as the page's postprocessScore does. The reader is shared with cais-text-capabilities-index.ts.
import type { Leaderboard } from './types.ts';
import { CAIS_ALIASES, CAIS_PAGE, CAIS_TERMS, caisIndexRows } from './cais-text-capabilities-index.ts';

const board: Leaderboard = {
  benchmark: 'cais-risk-index',
  url: CAIS_PAGE,
  feed: `${CAIS_PAGE} (page JS chunk, mean of art, 100 - refusal_avg, pct, hle_calibration_error, 100 - masks, machiavelli, textquests_harm)`,
  terms: CAIS_TERMS,
  aliases: CAIS_ALIASES,
  fetch: () =>
    caisIndexRows(['art', 'refusal_avg', 'pct', 'hle_calibration_error', 'masks', 'machiavelli', 'textquests_harm'], ['refusal_avg', 'masks']),
};
export default board;
