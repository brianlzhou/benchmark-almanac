// Design Arena: text-to-speech voices. People vote between two anonymous results, and the score is the board's Elo.
// Read through scripts/lib/boards/designarena.ts, which explains the feed, the effort settings and the terms.
import type { Leaderboard } from './types.ts';
import { DA_ALIASES, DA_TERMS, DA_STATS_TIME, daFeed, daRows, type DaBoard, DA_CHART_SPEED } from '../lib/boards/designarena.ts';

const BOARD: DaBoard = { arenaType: 'models', category: 'tts' };

const board: Leaderboard = {
  benchmark: 'designarena-tts',
  url: 'https://www.designarena.ai/leaderboard?tab=audio&section=tts&board=tts',
  feed: daFeed(BOARD),
  terms: DA_TERMS,
  aliases: DA_ALIASES,
  stats: DA_STATS_TIME,
  chart: DA_CHART_SPEED,
  fetch: () => daRows(BOARD),
};
export default board;
