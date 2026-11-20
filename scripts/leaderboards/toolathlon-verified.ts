// Toolathlon-Verified (released 2026-06-30), the current table on toolathlon.xyz. The reader lives in
// toolathlon.ts and keeps the published agents, turns, tool calls and pass rates.
import type { Leaderboard } from './types.ts';
import { TERMS, toolathlonRows } from './toolathlon.ts';

const board: Leaderboard = {
  benchmark: 'toolathlon-verified',
  url: 'https://toolathlon.xyz/docs/leaderboard',
  feed: 'https://toolathlon.xyz/docs/leaderboard.md (current table)',
  terms: TERMS,
  reference: ['Default'],
  aliases: {},
  fetch: () => toolathlonRows('verified', { metrics: true }),
};
export default board;
