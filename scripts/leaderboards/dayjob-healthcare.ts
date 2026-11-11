// DAYJOB Healthcare: Surge publishes the primary model leaderboard in server-rendered HTML.
// The headline score is a percentage. Retain reasoning effort separately from the model name.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { surgeRows, SURGE_TERMS, SURGE_ALIASES } from '../lib/boards/surgehq.ts';
const PAGE = 'https://surgehq.ai/benchmarks/dayjob-healthcare';
const board: Leaderboard = {
  benchmark: 'dayjob-healthcare', url: PAGE, feed: PAGE, terms: SURGE_TERMS, aliases: SURGE_ALIASES,
  async fetch() { return surgeRows(await fetchText(PAGE)); },
};
export default board;
