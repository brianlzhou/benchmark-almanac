import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { surgeRows, SURGE_TERMS, SURGE_ALIASES } from '../lib/boards/surgehq-cov2.ts';
const url = 'https://surgehq.ai/benchmarks/hemingway-bench';
const board: Leaderboard = { benchmark:'hemingway-bench', url, feed:`${url} (primary leaderboard)`,
 terms:SURGE_TERMS, aliases:SURGE_ALIASES, fetch:async()=>surgeRows(await fetchText(url)) };
export default board;
