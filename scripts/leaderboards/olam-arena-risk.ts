// Olam Labs' Multi-Agent Arena, Risk: four commanders, people or anonymized models, talk in sealed messages and then
// attack for territory on a 42-territory map (the arena's own version, "Warpath"). The board ranks models by their
// mean share of territory, where 25 is an even split among four seats. Its behavior charts give the share of attacks
// judged to be gambles and a "two-faced" rate graded over talking windows. The page defines neither. Read through
// olam-arena.ts, which says which charts the overview shows.
import type { Leaderboard } from './types.ts';
import { OLAM_HARNESS, OLAM_PAGE, OLAM_TERMS, olamRows } from './olam-arena.ts';

const board: Leaderboard = {
  benchmark: 'olam-arena-risk',
  url: `${OLAM_PAGE}#warpath`,
  feed: `${OLAM_PAGE} (the Risk charts in the page's HTML)`,
  terms: OLAM_TERMS,
  ...OLAM_HARNESS,
  fetch: () => olamRows('warpath-share', { gambleRate: 'warpath-gamble-rate', twoFacedRate: 'warpath-two-faced' }),
};
export default board;
