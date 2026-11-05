// SWE Atlas (Codebase QnA): Scale's board has one table. The score is the task resolve rate in percent (an
// answer must pass every rubric item). Names carry the harness ("(Claude Code)", "(Mini-SWE-Agent)") and effort.
// "*" marks runs with an elevated refusal rate, which Scale scored as failures.
// The ± after each score (confidenceInterval_upper) is kept as metrics.ciLow and ciHigh.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl, type ScaleEntry } from '../lib/scale.ts';

const PAGE = scaleUrl('sweatlas-qna');

/** The page prints "61.50 ± 3.10": confidenceInterval_upper is the half-width around the score. */
const ci = (_: unknown, e: ScaleEntry & { confidenceInterval_upper?: number | null }) => {
  const half = e.confidenceInterval_upper;
  const s = Number(e.score);
  const r = (x: number) => Math.round(x * 100) / 100;
  return typeof half === 'number' && half > 0 ? { metrics: { ciLow: r(s - half), ciHigh: r(s + half) } } : undefined;
};

const board: Leaderboard = {
  benchmark: 'swe-atlas',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {
    ...SCALE_ALIASES,
    // "GPT 5.3 (Codex)": GPT-5.3-Codex in the Codex harness (the page's text names "GPT 5.3 Codex")
    'GPT 5.3': 'gpt-5-3-codex',
  },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE), ci),
};
export default board;
