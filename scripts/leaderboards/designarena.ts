// Design Arena: every code category together: websites, games, 3D, data visualization, UI components, SVG and ASCII. People vote between two anonymous results, and the score is the board's Elo.
// Read through scripts/lib/boards/designarena.ts, which explains the feed, the effort settings and the terms.
import type { Leaderboard } from './types.ts';
import { DA_ALIASES, DA_TERMS, daFeed, daRows, type DaBoard } from '../lib/boards/designarena.ts';

const BOARD: DaBoard = { arenaType: 'models', category: 'allcategories' };

const board: Leaderboard = {
  benchmark: 'designarena',
  url: 'https://www.designarena.ai/leaderboard?section=overall&board=code',
  feed: daFeed(BOARD),
  terms: DA_TERMS,
  aliases: DA_ALIASES,
  fetch: () => daRows(BOARD),
};
export default board;
