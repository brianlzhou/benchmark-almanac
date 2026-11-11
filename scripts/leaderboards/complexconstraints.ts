// Official Surge primary leaderboard. Shared parser excludes unrelated benchmark previews.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { surgeRows, SURGE_TERMS, SURGE_ALIASES } from '../lib/boards/surgehq-cov2.ts';
const URL = 'https://surgehq.ai/benchmarks/complex-constraints';
const board: Leaderboard = {
  benchmark: 'complexconstraints', url: URL, feed: URL, terms: SURGE_TERMS,
  aliases: SURGE_ALIASES,
  async fetch() { return surgeRows(await fetchText(URL)); },
};
export default board;
