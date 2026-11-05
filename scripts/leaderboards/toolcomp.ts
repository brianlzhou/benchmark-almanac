// ToolComp: Scale runs two boards, Agentic Tool Use (Enterprise) and Agentic Tool Use (Chat). This importer reads
// the Enterprise board, which the benchmark's record links. The score is final-answer accuracy in percent, graded
// by an LLM against the ground truth.
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

const PAGE = scaleUrl('tool_use_enterprise');

const board: Leaderboard = {
  benchmark: 'toolcomp',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: { ...SCALE_ALIASES },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE), (_, e) => interval(e)),
};
export default board;
