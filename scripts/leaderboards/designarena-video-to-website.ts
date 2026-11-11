// Design Arena: single-file websites from a video. People vote between two anonymous results, and the score is the board's Elo.
// Read through scripts/lib/boards/designarena.ts, which explains the feed, the effort settings and the terms.
import type { Leaderboard } from './types.ts';
import { DA_ALIASES, DA_TERMS, daFeed, daRows, type DaBoard } from '../lib/boards/designarena.ts';

const BOARD: DaBoard = { arenaType: 'models', category: 'website', inputModality: 'video' };

const board: Leaderboard = {
  benchmark: 'designarena-video-to-website',
  url: 'https://www.designarena.ai/leaderboard?section=website&board=video-to-website',
  feed: daFeed(BOARD),
  terms: DA_TERMS,
  aliases: DA_ALIASES,
  fetch: () => daRows(BOARD),
};
export default board;
