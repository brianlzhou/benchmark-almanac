// Arena's Video Edit Arena, read through Arena's Hugging Face dataset: its "video_edit" subset, overall category, latest split.
// The helper lives in lmarena-elo.ts.
import type { Leaderboard } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRows } from './lmarena-elo.ts';

const board: Leaderboard = {
  benchmark: 'lmarena-video-edit',
  url: 'https://arena.ai/leaderboard',
  feed: arenaFeed('video_edit'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  fetch: () => arenaRows('video_edit'),
};
export default board;
