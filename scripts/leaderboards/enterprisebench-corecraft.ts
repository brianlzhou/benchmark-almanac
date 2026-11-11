// EnterpriseBench CoreCraft: the primary Webflow board publishes full-environment task success percentages.
// The shared Surge reader stops before unrelated benchmark previews and preserves reasoning effort.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { surgeRows, SURGE_TERMS } from '../lib/boards/surgehq-cov2.ts';
const PAGE = 'https://surgehq.ai/benchmarks/enterprisebench-corecraft';
const board: Leaderboard = {
 benchmark: 'enterprisebench-corecraft', url: PAGE, feed: `${PAGE} (primary data-leaderboard-row elements)`,
 terms: SURGE_TERMS,
 aliases: {'Muse Wonder 1.0': 'muse-wonder'},
 fetch: async () => surgeRows(await fetchText(PAGE)),
};
export default board;
