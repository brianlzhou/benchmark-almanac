// Toolathlon-Verified (released 2026-06-30), the current table on toolathlon.xyz. The reader lives in
// toolathlon.ts.
import type { Leaderboard } from './types.ts';
import { TERMS, toolathlonRows } from './toolathlon.ts';

const board: Leaderboard = {
  benchmark: 'toolathlon-verified',
  url: 'https://toolathlon.xyz/docs/leaderboard',
  feed: 'https://toolathlon.xyz/docs/leaderboard.md (current table)',
  terms: TERMS,
  aliases: {},
  fetch: () => toolathlonRows('verified'),
};
export default board;
