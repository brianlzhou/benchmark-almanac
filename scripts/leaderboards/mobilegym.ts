// MobileGym on mobilegym.dev. The page is static HTML whose first table ranks models on four task levels,
// grouped under label rows (proprietary, GUI-specialized open models, open generalist models): Model |
// L1 (20) | L2 (73) | L3 (83) | L4 (80) | SR. The overall success rate SR (0 to 100) is the score. The reader
// lives in visulogic.ts and skips the one-cell group label rows.
import type { Leaderboard } from './types.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://mobilegym.dev/';

const board: Leaderboard = {
  benchmark: 'mobilegym',
  url: URL,
  feed: `${URL} (leaderboard table, SR)`,
  terms: 'Static public page; robots.txt allows all paths for generic agents with a content signal, and the site publishes no terms.',
  aliases: {},
  fetch: () => tableRows(URL, { model: /^Model$/i, score: /^SR$/i }),
};
export default board;
