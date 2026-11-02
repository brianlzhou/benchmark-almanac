// CAIS Vision Capabilities Index on the CAIS AI Dashboard: the mean of ERQA, MindCube, SpatialViz, IntPhys 2
// and EnigmaEval for each model, as the dashboard table computes it in the browser. Text-only models are left
// out, as on the page. The reader is shared with cais-text-capabilities-index.ts.
import type { Leaderboard } from './types.ts';
import { CAIS_ALIASES, CAIS_PAGE, CAIS_TERMS, caisIndexRows } from './cais-text-capabilities-index.ts';

const board: Leaderboard = {
  benchmark: 'cais-vision-capabilities-index',
  url: CAIS_PAGE,
  feed: `${CAIS_PAGE} (page JS chunk, mean of erqa, mindcube, spatialviz, intphys2 and enigmaeval)`,
  terms: CAIS_TERMS,
  aliases: CAIS_ALIASES,
  fetch: () => caisIndexRows(['erqa', 'mindcube', 'spatialviz', 'intphys2', 'enigmaeval'], [], (m) => m.isTextOnlyModel === true),
};
export default board;
