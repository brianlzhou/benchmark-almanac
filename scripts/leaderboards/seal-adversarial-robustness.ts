// SEAL Adversarial Robustness: Scale's board (deprecated by Scale, still served) has one table. The score is the
// number of high-harm violations on the red-team prompts, so lower is better. The board's ± interval is kept
// as metrics.ciLow and ciHigh.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl, type ScaleEntry } from '../lib/scale.ts';

const PAGE = scaleUrl('adversarial_robustness');

/** The board's "± x" interval (confidenceInterval_upper is the half-width) as bounds, the low bound kept at 0 or above. */
const ci = (e: ScaleEntry & { confidenceInterval_upper?: number }) => {
  const h = Number(e.confidenceInterval_upper);
  const s = Number(e.score);
  return Number.isFinite(h) && h > 0 ? { ciLow: Math.max(0, +(s - h).toFixed(2)), ciHigh: +(s + h).toFixed(2) } : undefined;
};

const board: Leaderboard = {
  benchmark: 'seal-adversarial-robustness',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {
    ...SCALE_ALIASES,
    // the version field says gemini-1.5-flash-preview-0514
    'Gemini 1.5 Flash': 'gemini-1-5-flash-may-2024',
  },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE), (_, e) => (ci(e) ? { metrics: ci(e) } : undefined)),
};
export default board;
