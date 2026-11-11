import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { surgeRows, SURGE_TERMS, SURGE_ALIASES } from '../lib/boards/surgehq.ts';
const url='https://surgehq.ai/benchmarks/sudo-l7';
const board:Leaderboard={benchmark:'sudo-l7',url,feed:url,terms:SURGE_TERMS,aliases:SURGE_ALIASES,fetch:async()=>surgeRows(await fetchText(url))};
export default board;
