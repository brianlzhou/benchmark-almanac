// FORTRESS: Scale's board has one table, ranked by the Average Risk Score (ARS): the average share of rubric
// questions a judge panel answers "yes" for harmful content across the adversarial prompts, 0 to 100, lower is
// better. The Over-Refusal Score on the paired benign prompts appears only as a note on each row.
import type { Leaderboard } from './types.ts';
import { SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('fortress');

const board: Leaderboard = {
  benchmark: 'fortress',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {},
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE)),
};
export default board;
