// SEAL Multilingual: Scale ran one board per language (Spanish, Japanese, Chinese, Arabic, Korean). This importer
// reads the Spanish board, which the benchmark's record links. The score is the board's Elo-style rating from
// side-by-side human ratings.
// The board's "±" after each score (confidenceInterval_upper) is kept as the interval's bounds,
// metrics.ciLow and metrics.ciHigh.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, type ScaleEntry, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

/** The ± half-width Scale prints after the score, as the interval's two ends. */
function interval(e: ScaleEntry) {
  const half = Number((e as ScaleEntry & { confidenceInterval_upper?: number }).confidenceInterval_upper);
  const score = Number(e.score);
  return half > 0 ? { metrics: { ciLow: score - half, ciHigh: score + half } } : undefined;
}

const PAGE = scaleUrl('spanish');

const board: Leaderboard = {
  benchmark: 'seal-multilingual',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS + " The Almanac credits and links Scale as the source.",
  aliases: {
    ...SCALE_ALIASES,
    // the version field says gemini-2.0-flash-exp
    'Gemini Pro Flash 2': 'gemini-2-0-flash-dec-2024',
    // the version field says gemini-1.5-flash-preview-0514
    'Gemini 1.5 Flash': 'gemini-1-5-flash-may-2024',
  },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE), (_, e) => interval(e)),
};
export default board;
