// PRBench: Scale runs two boards, Legal and Finance. This importer reads the Legal board, which the benchmark's
// record links, on the full task set (the Hard subset appears only in the page's text). The score is the
// rubric-weighted score clipped to 0 to 1, which the board shows times 100.
// The ± after each score (confidenceInterval_upper) is kept as metrics.ciLow and ciHigh.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl, type ScaleEntry } from '../lib/scale.ts';

const PAGE = scaleUrl('prbench-legal');

/** The page prints "61.50 ± 3.10": confidenceInterval_upper is the half-width around the score. */
const ci = (_: unknown, e: ScaleEntry & { confidenceInterval_upper?: number | null }) => {
  const half = e.confidenceInterval_upper;
  const s = Number(e.score);
  const r = (x: number) => Math.round(x * 100) / 100;
  return typeof half === 'number' && half > 0 ? { metrics: { ciLow: r(s - half), ciHigh: r(s + half) } } : undefined;
};

const board: Leaderboard = {
  benchmark: 'prbench',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {
    ...SCALE_ALIASES,
    'qwen.qwen3-235b-a22b-2507-v1:0': 'qwen3-235b-a22b-instruct-jul-2025',
    // the stable API id, the June 2025 release (the resolver would take the September preview)
    'gemini-2.5-flash': 'gemini-2-5-flash-jun-2025',
  },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE), ci),
};
export default board;
