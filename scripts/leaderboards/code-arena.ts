// Code Arena, read through Arena's Hugging Face dataset: its "webdev" subset is Code Arena (data from
// 2025-11-12 on), overall category of the latest leaderboard. The helper lives in lmarena-elo.ts.
// HTML and React go in the category switch. Image-to-WebDev is its own record (arena-image-to-webdev.ts). The
// "webdev" category has every overall vote (the same vote count for each model) but a different rating,
// and stays a secondary view. Only the HTML and React prompt subsets are parts.
import type { Leaderboard } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRowsByCategory } from './lmarena-elo.ts';

const board: Leaderboard = {
  benchmark: 'code-arena',
  stats: {
    votes: { name: 'Votes', unit: 'count' },
    'cat:webdev': { name: 'WebDev category rating', unit: 'rating', better: 'higher', note: 'Secondary Arena category rating across all webdev prompts.' },
  },
  parts: { 'cat:webdev-html': 'HTML', 'cat:webdev-react': 'React' },
  url: 'https://arena.ai/leaderboard/code/webdev',
  feed: arenaFeed('webdev', '*'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  fetch: () => arenaRowsByCategory('webdev', { skip: ['image_to_webdev'] }),
};
export default board;
