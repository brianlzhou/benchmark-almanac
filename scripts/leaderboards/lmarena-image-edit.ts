// Arena's Image Edit Arena, read through Arena's Hugging Face dataset: its "image_edit" subset, overall category, latest split.
// The helper lives in lmarena-elo.ts.
import type { Leaderboard } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRows } from './lmarena-elo.ts';

const board: Leaderboard = {
  benchmark: 'lmarena-image-edit',
  url: 'https://arena.ai/leaderboard',
  feed: arenaFeed('image_edit'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  fetch: () => arenaRows('image_edit'),
};
export default board;
