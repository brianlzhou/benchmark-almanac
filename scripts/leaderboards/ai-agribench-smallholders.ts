// AI AgriBench Smallholders evaluates agronomy answers for smallholder farming.
// The shared AgriBench reader averages accuracy judgments from the smallholders API variant.
import type { Leaderboard } from './types.ts';
import { agribenchRows, terms } from './ai-agribench.ts';

const board: Leaderboard = {
  benchmark: 'ai-agribench-smallholders',
  url: 'https://aiagribench.org/smallholders',
  feed: 'https://aiagribench.org/api/leaderboard?variant=smallholders',
  terms,
  fetch: () => agribenchRows(board, 13),
};
export default board;
