// GSM1k: Scale's SEAL Math board (deprecated by Scale, still served) has one table. The score is accuracy in
// percent on the held-out grade school math problems.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('math');

const board: Leaderboard = {
  benchmark: 'gsm1k',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {
    ...SCALE_ALIASES,
    // the version field says gemini-1.5-flash-preview-0514
    'Gemini 1.5 Flash': 'gemini-1-5-flash-may-2024',
  },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE)),
};
export default board;
