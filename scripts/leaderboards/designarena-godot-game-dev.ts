// Design Arena: Godot games. People vote between two anonymous results, and the score is the board's Elo.
// Read through scripts/lib/boards/designarena.ts, which explains the feed, the effort settings and the terms.
import type { Leaderboard } from './types.ts';
import { DA_ALIASES, DA_TERMS, daFeed, daRows, type DaBoard } from '../lib/boards/designarena.ts';

const BOARD: DaBoard = { arenaType: 'agents', category: 'agon_godot' };

const board: Leaderboard = {
  benchmark: 'designarena-godot-game-dev',
  url: 'https://www.designarena.ai/leaderboard?section=game-dev&board=godot-game-dev',
  feed: daFeed(BOARD),
  terms: DA_TERMS,
  aliases: DA_ALIASES,
  fetch: () => daRows(BOARD),
};
export default board;
