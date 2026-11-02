// Math Kangaroo 2025 on MathArena: the Visual Math overall table, which averages the six Kangaroo 2025 grade
// groups (1-2 to 11-12) for models run on all of them. Read through the helper in aime-2026.ts.
import type { Leaderboard } from './types.ts';
import { MATHARENA_ALIASES, MATHARENA_TERMS, matharenaFeed, matharenaPage, matharenaRows } from './aime-2026.ts';

const COMP = 'overall--visual_math';

const board: Leaderboard = {
  benchmark: 'kangaroo-2025-matharena',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: { ...MATHARENA_ALIASES, 'Qwen3-VL-235B Instruct': 'qwen3-vl-235b-a22b-instruct' },
  fetch: () => matharenaRows(COMP),
};
export default board;
