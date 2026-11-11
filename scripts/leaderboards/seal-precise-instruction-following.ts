// SEAL Precise Instruction Following: Scale's board (deprecated by Scale, still served) has one table. The score
// is the board's human-preference score from side-by-side ratings, higher is better.
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

const PAGE = scaleUrl('instruction_following');

const board: Leaderboard = {
  benchmark: 'seal-precise-instruction-following',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS + ' Scale restricts automated access. The Almanac credits Scale AI and links its source.',
  aliases: {
    ...SCALE_ALIASES,
    // the version field says DeepSeek-V3, and Scale retired the board before the March 2025 V3
    'Deepseek V3': 'deepseek-v3',
  },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE), (_, e) => interval(e)),
};
export default board;
