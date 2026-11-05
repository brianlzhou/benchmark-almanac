// Humanity's Sixth Sense: Scale's board has one table. The score is pass@1 in percent, averaged over three
// attempts per task (a task passes only if every rubric item is met). Names carry the reasoning effort.
// The board's "± 4.20" after each score (confidenceInterval_upper) is kept as the interval's bounds,
// metrics.ciLow and metrics.ciHigh.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, type ScaleEntry, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

/** The ± half-width Scale prints after the score, as the interval's two ends. */
function interval(e: ScaleEntry) {
  const half = Number((e as ScaleEntry & { confidenceInterval_upper?: number }).confidenceInterval_upper);
  const score = Number(e.score);
  return half > 0 ? { metrics: { ciLow: score - half, ciHigh: score + half } } : undefined;
}

const PAGE = scaleUrl('hss');

const board: Leaderboard = {
  benchmark: 'humanitys-sixth-sense',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: { ...SCALE_ALIASES },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE), (_, e) => interval(e)),
};
export default board;
