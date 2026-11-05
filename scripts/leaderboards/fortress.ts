// FORTRESS: Scale's board has one table, ranked by the Average Risk Score (ARS): the average share of rubric
// questions a judge panel answers "yes" for harmful content across the adversarial prompts, 0 to 100, lower is
// better. The Over-Refusal Score on the paired benign prompts appears only as a note on each row ("ORS score:
// 28.78"), kept as metrics.ors; the board's ± interval is kept as metrics.ciLow and ciHigh.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl, type ScaleEntry } from '../lib/scale.ts';

const PAGE = scaleUrl('fortress');

/** The board's "± x" interval (confidenceInterval_upper is the half-width) as bounds, kept within 0 to 100. */
const ci = (e: ScaleEntry & { confidenceInterval_upper?: number }) => {
  const h = Number(e.confidenceInterval_upper);
  const s = Number(e.score);
  return Number.isFinite(h) && h > 0 ? { ciLow: Math.max(0, +(s - h).toFixed(2)), ciHigh: Math.min(100, +(s + h).toFixed(2)) } : undefined;
};

const board: Leaderboard = {
  benchmark: 'fortress',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {
    ...SCALE_ALIASES,
    'nemotron-3-ultra-nvfp4': 'nemotron-3-ultra',
    'Gemini 2.5 Pro (03-25)': 'gemini-2-5-pro-mar-2025',
    'Gemini 2.5 Pro (06-05)': 'gemini-2-5-pro-jun-2025',
    // the API's gpt-4o pointed to the August 2024 snapshot when this board was run (2025)
    'GPT-4o': 'gpt-4o-aug-2024',
  },
  fetch: async () =>
    scaleRows(await fetchScaleEntries(PAGE), (_, e) => {
      const ors = Number(e.contaminationMessage?.match(/ORS score:\s*([\d.]+)/)?.[1]);
      const metrics = { ...ci(e), ...(Number.isFinite(ors) ? { ors } : {}) };
      return Object.keys(metrics).length ? { metrics } : undefined;
    }),
};
export default board;
