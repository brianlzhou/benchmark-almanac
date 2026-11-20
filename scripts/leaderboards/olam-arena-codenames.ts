// Olam Labs' Multi-Agent Arena, Codenames: two teams of anonymized models play the word game, each with a handler who
// gives one-word clues and operatives who guess. The board rates each role on its own Elo scale and gives no single
// Codenames rating, so the headline is the handler rating, the board's first chart, and both roles are parts. Read
// through olam-arena.ts, which says which charts the overview shows.
import type { Leaderboard } from './types.ts';
import { OLAM_HARNESS, OLAM_PAGE, OLAM_TERMS, olamRows } from './olam-arena.ts';

const board: Leaderboard = {
  benchmark: 'olam-arena-codenames',
  url: `${OLAM_PAGE}#codegames`,
  feed: `${OLAM_PAGE} (the Codenames charts in the page's HTML)`,
  terms: OLAM_TERMS,
  ...OLAM_HARNESS,
  parts: {
    handler: { name: 'Handler', group: 'Role', note: 'Gives the one-word clues.' },
    operative: { name: 'Operative', group: 'Role', note: 'Guesses words from the clues.' },
  },
  fetch: async () => {
    const rows = await olamRows('codegames-handler-elo', { operative: 'codegames-operative-elo' });
    for (const r of rows) (r.metrics ??= {}).handler = r.score;
    return rows;
  },
};
export default board;
