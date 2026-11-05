// SWE-Bench Pro V2 Hard: the "hard" tab (SWE-Bench Pro V2 HARD) of Scale's SWE-Bench Pro V2 board, the tab the
// page opens on. The score is the resolve rate in percent. Names carry the harness and effort. The board's
// ± interval is kept as metrics.ciLow and ciHigh.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl, type ScaleEntry } from '../lib/scale.ts';

const PAGE = scaleUrl('swe_bench_pro_public_v2');
const TAB = 'hard';

/** The board's "± x" interval (confidenceInterval_upper is the half-width) as bounds, kept within 0 to 100. */
const ci = (e: ScaleEntry & { confidenceInterval_upper?: number }) => {
  const h = Number(e.confidenceInterval_upper);
  const s = Number(e.score);
  return Number.isFinite(h) && h > 0 ? { ciLow: Math.max(0, +(s - h).toFixed(2)), ciHigh: Math.min(100, +(s + h).toFixed(2)) } : undefined;
};

const board: Leaderboard = {
  benchmark: 'swe-bench-pro-v2-hard',
  url: PAGE,
  feed: scaleFeed(PAGE, TAB),
  terms: SCALE_TERMS,
  aliases: { ...SCALE_ALIASES },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE, TAB), (_, e) => (ci(e) ? { metrics: ci(e) } : undefined)),
};
export default board;
