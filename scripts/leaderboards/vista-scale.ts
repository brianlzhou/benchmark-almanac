// VISTA (Scale's visual-language understanding board): one table. The score is the Average Task Accuracy in
// percent: the share of rubric questions a three-judge jury finds satisfied, averaged over tasks.
// The ± after each score (confidenceInterval_upper) is kept as metrics.ciLow and ciHigh.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl, type ScaleEntry } from '../lib/scale.ts';

const PAGE = scaleUrl('visual_language_understanding');

/** The page prints "61.50 ± 3.10": confidenceInterval_upper is the half-width around the score. */
const ci = (_: unknown, e: ScaleEntry & { confidenceInterval_upper?: number | null }) => {
  const half = e.confidenceInterval_upper;
  const s = Number(e.score);
  const r = (x: number) => Math.round(x * 100) / 100;
  return typeof half === 'number' && half > 0 ? { metrics: { ciLow: r(s - half), ciHigh: r(s + half) } } : undefined;
};

const board: Leaderboard = {
  benchmark: 'vista-scale',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {
    ...SCALE_ALIASES,
    'ChatGPT-4o-latest (November 2024)': 'gpt-4o-nov-2024',
    'Pixtral Large (November 2024)': 'pixtral-large',
    'Pixtral 12B (September 2024)': 'pixtral-12b',
  },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE), ci),
};
export default board;
