// Arena's Text-to-Image Arena, read through Arena's Hugging Face dataset: its "text_to_image" subset, overall category, latest split.
// The helper lives in lmarena-elo.ts.
import type { Leaderboard } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRowsByCategory } from './lmarena-elo.ts';

const board: Leaderboard = {
  benchmark: 'lmarena-text-to-image',
  parts: {
    'cat:3d_modeling': '3D modeling',
    'cat:agentic': 'Agentic',
    'cat:art': 'Art',
    'cat:cartoon': 'Cartoon',
    'cat:commercial_design': 'Commercial design',
    'cat:photorealistic': 'Photorealistic',
    'cat:portraits': 'Portraits',
    'cat:text_rendering': 'Text rendering',
  },
  url: 'https://arena.ai/leaderboard',
  feed: arenaFeed('text_to_image', '*'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  fetch: () => arenaRowsByCategory('text_to_image'),
};
export default board;
