// MultiNRC: Scale's board (deprecated by Scale, still served) has one table. The score is accuracy in percent
// against the native speakers' reference answers.
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

const PAGE = scaleUrl('multinrc');

const board: Leaderboard = {
  benchmark: 'multinrc',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {
    ...SCALE_ALIASES,
    // the API's gpt-4o pointed to the August 2024 snapshot when this board was run (2025)
    'GPT-4o': 'gpt-4o-aug-2024',
  },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE), (_, e) => interval(e)),
};
export default board;
