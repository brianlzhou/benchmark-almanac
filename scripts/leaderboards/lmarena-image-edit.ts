// Arena's Image Edit Arena, read through Arena's Hugging Face dataset: its "image_edit" subset, overall category, latest split.
// The helper lives in lmarena-elo.ts.
import type { Leaderboard } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRowsByCategory } from './lmarena-elo.ts';

const board: Leaderboard = {
  benchmark: 'lmarena-image-edit',
  stats: { votes: { name: 'Votes', unit: 'count' } },
  parts: { 'cat:agentic': 'Agentic', 'cat:multi_image_edit': 'Multi-image edit', 'cat:multi_image_edit_agentic': 'Multi-image edit agentic' },
  url: 'https://arena.ai/leaderboard',
  feed: arenaFeed('image_edit', '*'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  fetch: () => arenaRowsByCategory('image_edit'),
};
export default board;
