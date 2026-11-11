// SWE Atlas Test Writing: Scale's board has one table. The score is the task resolve rate in percent (the tests
// must pass the manifest check, the mutation test and the rubrics). Names carry the harness and effort. "*" marks
// runs with an elevated refusal rate, which Scale scored as failures. The board's ± interval is kept as
// metrics.ciLow and ciHigh.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl, type ScaleEntry } from '../lib/scale.ts';

const PAGE = scaleUrl('sweatlas-tw');

/** The board's "± x" interval (confidenceInterval_upper is the half-width) as bounds, kept within 0 to 100. */
const ci = (e: ScaleEntry & { confidenceInterval_upper?: number }) => {
  const h = Number(e.confidenceInterval_upper);
  const s = Number(e.score);
  return Number.isFinite(h) && h > 0 ? { ciLow: Math.max(0, +(s - h).toFixed(2)), ciHigh: Math.min(100, +(s + h).toFixed(2)) } : undefined;
};

const board: Leaderboard = {
  benchmark: 'swe-atlas-test-writing',
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
