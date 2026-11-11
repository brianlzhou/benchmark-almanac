// Design Arena: slide decks an agent builds with python-pptx. People vote between two anonymous results, and the score is the board's Elo.
// Read through scripts/lib/boards/designarena.ts, which explains the feed, the effort settings and the terms.
import type { Leaderboard } from './types.ts';
import { DA_ALIASES, DA_TERMS, daFeed, daRows, type DaBoard } from '../lib/boards/designarena.ts';

const BOARD: DaBoard = { arenaType: 'agents', category: 'agon_slides' };

const board: Leaderboard = {
  benchmark: 'designarena-python-pptx-slides',
  url: 'https://www.designarena.ai/leaderboard?tab=office&section=slides&board=agentic-slides',
  feed: daFeed(BOARD),
  terms: DA_TERMS,
  aliases: DA_ALIASES,
  fetch: () => daRows(BOARD),
};
export default board;
