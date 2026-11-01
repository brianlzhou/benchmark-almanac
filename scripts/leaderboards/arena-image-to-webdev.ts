// Arena's Image-to-WebDev Arena, read through Arena's Hugging Face dataset: the "image_to_webdev" category of its "webdev" subset, latest split.
// The helper lives in lmarena-elo.ts.
import type { Leaderboard } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRows } from './lmarena-elo.ts';

const board: Leaderboard = {
  benchmark: 'arena-image-to-webdev',
  url: 'https://arena.ai/leaderboard/code/image-to-webdev',
  feed: arenaFeed('webdev', 'image_to_webdev'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  fetch: () => arenaRows('webdev', 'image_to_webdev'),
};
export default board;
