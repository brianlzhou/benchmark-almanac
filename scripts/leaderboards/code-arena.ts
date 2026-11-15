// Code Arena, read through Arena's Hugging Face dataset: its "webdev" subset is Code Arena (data from
// 2025-11-12 on), overall category of the latest leaderboard. The helper lives in lmarena-elo.ts.
// HTML and React go in the category switch. Image-to-WebDev is its own record (arena-image-to-webdev.ts). The
// "webdev" category has every overall vote (the same vote count for each model) but a different rating,
// and Arena doesn't say how it differs, so it stays out.
import type { Leaderboard } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRowsByCategory } from './lmarena-elo.ts';

const board: Leaderboard = {
  benchmark: 'code-arena',
  url: 'https://arena.ai/leaderboard/code/webdev',
  feed: arenaFeed('webdev', '*'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  fetch: () => arenaRowsByCategory('webdev', { skip: ['image_to_webdev', 'webdev'] }),
};
export default board;
