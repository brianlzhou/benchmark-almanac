// Design Arena: images from a text prompt. People vote between two anonymous results, and the score is the board's Elo.
// Read through scripts/lib/boards/designarena.ts, which explains the feed, the effort settings and the terms.
import type { Leaderboard } from './types.ts';
import { DA_ALIASES, DA_TERMS, daFeed, daRows, type DaBoard } from '../lib/boards/designarena.ts';

const BOARD: DaBoard = { arenaType: 'models', category: 'image' };

const board: Leaderboard = {
  benchmark: 'designarena-image',
  url: 'https://www.designarena.ai/leaderboard?tab=image&section=image&board=image',
  feed: daFeed(BOARD),
  terms: DA_TERMS,
  aliases: DA_ALIASES,
  fetch: () => daRows(BOARD),
};
export default board;
