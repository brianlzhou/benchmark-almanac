// Design Arena: slide decks from products in their own harness. People vote between two anonymous results, and the score is the board's Elo.
// Read through scripts/lib/boards/designarena.ts, which explains the feed, the effort settings and the terms.
import type { Leaderboard } from './types.ts';
import { DA_ALIASES, DA_TERMS, DA_STATS_FULL, daFeed, daRows, type DaBoard, DA_CHART_SPEED } from '../lib/boards/designarena.ts';

const BOARD: DaBoard = { arenaType: 'models', category: 'slides' };

const board: Leaderboard = {
  benchmark: 'designarena-slides',
  url: 'https://www.designarena.ai/leaderboard?tab=office&section=slides&board=slides',
  feed: daFeed(BOARD),
  terms: DA_TERMS,
  aliases: DA_ALIASES,
  stats: DA_STATS_FULL,
  chart: DA_CHART_SPEED,
  fetch: () => daRows(BOARD),
};
export default board;
