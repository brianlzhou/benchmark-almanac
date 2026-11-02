// SEAL Coding: Scale's board (deprecated by Scale, still served) has one table. The score is the board's
// Elo-style rating from side-by-side human ratings. Some rows name the effort only in the version field
// ("o3-mini-2025-01-31 (high)"), which the importer reads.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('coding');

const board: Leaderboard = {
  benchmark: 'seal-coding',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {
    ...SCALE_ALIASES,
    // the version field says DeepSeek-V3, and Scale retired the board before the March 2025 V3
    'Deepseek V3': 'deepseek-v3',
    // the version field says gemini-1.5-flash-preview-0514
    'Gemini 1.5 Flash': 'gemini-1-5-flash-may-2024',
  },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE)),
};
export default board;
