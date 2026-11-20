// Arena's Vision Arena, read through Arena's Hugging Face dataset: its "vision_style_control" subset, overall category, latest split. Its default view controls for style, so this reads the style-controlled subset.
// The helper lives in lmarena-elo.ts.
import type { Leaderboard } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRowsByCategory } from './lmarena-elo.ts';

const board: Leaderboard = {
  benchmark: 'vision-arena',
  parts: {
    'cat:captioning': { name: 'Captioning', group: 'Task' },
    'cat:chinese': { name: 'Chinese', group: 'Language' },
    'cat:creative_writing_vision': { name: 'Creative writing (vision)', group: 'Task' },
    'cat:diagram': { name: 'Diagram', group: 'Task' },
    'cat:english': { name: 'English', group: 'Language' },
    'cat:entity_recognition': { name: 'Entity recognition', group: 'Task' },
    'cat:homework': { name: 'Homework', group: 'Task' },
    'cat:humor': { name: 'Humor', group: 'Task' },
    'cat:ocr': { name: 'OCR', group: 'Task' },
  },
  url: 'https://arena.ai/leaderboard/chat/vision',
  feed: arenaFeed('vision_style_control', '*'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  fetch: () => arenaRowsByCategory('vision_style_control'),
};
export default board;
