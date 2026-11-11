// Design Arena: games an agent builds. People vote between two anonymous results, and the score is the board's Elo.
// Read through scripts/lib/boards/designarena.ts, which explains the feed, the effort settings and the terms.
import type { Leaderboard } from './types.ts';
import { DA_ALIASES, DA_TERMS, daFeed, daRows, type DaBoard } from '../lib/boards/designarena.ts';

const BOARD: DaBoard = { arenaType: 'agents', category: 'agentic_gamedev' };

const board: Leaderboard = {
  benchmark: 'designarena-agentic-game-dev',
  url: 'https://www.designarena.ai/leaderboard?section=game-dev&board=agentic-game-dev',
  feed: daFeed(BOARD),
  terms: DA_TERMS,
  aliases: DA_ALIASES,
  fetch: () => daRows(BOARD),
};
export default board;
