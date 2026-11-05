// EnigmaEval: Scale's board (deprecated by Scale, still served) has one table of five entries. The score is
// accuracy (pass@1) in percent. Names end in the effort ("claude-fable-5-high"), which the resolver splits off.
// The board's ± (each entry's confidenceInterval_upper) becomes the interval bounds metrics.ciLow and ciHigh.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('enigma_eval');

const board: Leaderboard = {
  benchmark: 'enigmaeval',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: { ...SCALE_ALIASES },
  fetch: async () =>
    scaleRows(await fetchScaleEntries(PAGE), (_, e) => {
      const ci = (e as { confidenceInterval_upper?: number }).confidenceInterval_upper;
      const score = Number(e.score);
      return typeof ci === 'number' && ci > 0 ? { metrics: { ciLow: score - ci, ciHigh: score + ci } } : undefined;
    }),
};
export default board;
