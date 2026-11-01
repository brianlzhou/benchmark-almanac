// Arena's Document Arena, read through Arena's Hugging Face dataset: its "document_style_control" subset, overall category, latest split. Its default view controls for style, so this reads the style-controlled subset.
// The helper lives in lmarena-elo.ts.
import type { Leaderboard } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRows } from './lmarena-elo.ts';

const board: Leaderboard = {
  benchmark: 'document-arena',
  url: 'https://arena.ai/leaderboard/chat/document',
  feed: arenaFeed('document_style_control'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  fetch: () => arenaRows('document_style_control'),
};
export default board;
