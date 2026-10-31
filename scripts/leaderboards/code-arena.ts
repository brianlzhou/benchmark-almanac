// Code Arena, read through Arena's Hugging Face dataset: its "webdev" subset is Code Arena (data from
// 2025-11-12 on), overall category of the latest leaderboard. The helper lives in lmarena-elo.ts.
import type { Leaderboard } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRows } from './lmarena-elo.ts';

const board: Leaderboard = {
  benchmark: 'code-arena',
  url: 'https://arena.ai/leaderboard/code/webdev',
  feed: arenaFeed('webdev'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  fetch: () => arenaRows('webdev'),
};
export default board;
