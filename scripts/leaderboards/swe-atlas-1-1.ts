// SWE Atlas v1.1 combines all three task categories in the source aggregate.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl, type ScaleEntry } from '../lib/scale.ts';

const PAGE = scaleUrl('swe-atlas');

/** The board's "± x" interval (confidenceInterval_upper is the half-width) as bounds, kept within 0 to 100. */
const ci = (e: ScaleEntry & { confidenceInterval_upper?: number }) => {
  const h = Number(e.confidenceInterval_upper);
  const s = Number(e.score);
  return Number.isFinite(h) && h > 0 ? { ciLow: Math.max(0, +(s - h).toFixed(2)), ciHigh: Math.min(100, +(s + h).toFixed(2)) } : undefined;
};

const board: Leaderboard = {
  benchmark: 'swe-atlas-1-1',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: 'Scale terms restrict automated extraction. The almanac credits Scale AI and links the source.',
  aliases: {
    ...SCALE_ALIASES,
    // "GPT 5.3 (Codex)": GPT-5.3-Codex in the Codex harness, as on the SWE Atlas Codebase QnA board
    'GPT 5.3': 'gpt-5-3-codex',
  },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE), (_, e) => (ci(e) ? { metrics: ci(e) } : undefined)),
};
export default board;
