// MCP Atlas: Scale's board has one table. The score is the pass rate in percent, the board's ranking metric
// (a task passes at a claim coverage of 0.75 or more). "*" marks models Scale served through Fireworks AI.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('mcp_atlas');

const board: Leaderboard = {
  benchmark: 'mcp-atlas',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: { ...SCALE_ALIASES },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE)),
};
export default board;
