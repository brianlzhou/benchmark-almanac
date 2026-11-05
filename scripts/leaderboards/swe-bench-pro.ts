// SWE-Bench Pro: Scale's board, read from the "public" tab (SWE-Bench Pro (Public Dataset)), the tab the page
// opens on. The "private" tab scores the held-out set. The score is the resolve rate in percent. The page says
// it ran models with the SWE-agent scaffold and marks runs made with mini-SWE-agent with "*".
// The ± after each score (confidenceInterval_upper) is kept as metrics.ciLow and ciHigh.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl, type ScaleEntry } from '../lib/scale.ts';

const PAGE = scaleUrl('swe_bench_pro');
const TAB = 'public';

/** The page prints "61.50 ± 3.10": confidenceInterval_upper is the half-width around the score. */
const ci = (_: unknown, e: ScaleEntry & { confidenceInterval_upper?: number | null }) => {
  const half = e.confidenceInterval_upper;
  const s = Number(e.score);
  const r = (x: number) => Math.round(x * 100) / 100;
  return typeof half === 'number' && half > 0 ? { metrics: { ciLow: r(s - half), ciHigh: r(s + half) } } : undefined;
};

const board: Leaderboard = {
  benchmark: 'swe-bench-pro',
  url: PAGE,
  feed: scaleFeed(PAGE, TAB),
  terms: SCALE_TERMS,
  aliases: {
    ...SCALE_ALIASES,
    'minimax-2.1': 'minimax-m2-1',
  },
  fetch: async () =>
    scaleRows(await fetchScaleEntries(PAGE, TAB), (n, e) => ({ harness: n.marks.includes('*') ? 'mini-SWE-agent' : 'SWE-agent', ...ci(n, e) })),
};
export default board;
