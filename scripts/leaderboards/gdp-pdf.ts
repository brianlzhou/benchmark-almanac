// GDP.pdf (Surge AI): the primary live leaderboard reports the percentage of responses
// passing all rubric criteria across professional PDF tasks. Do not mix the nearby boards.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { SURGE_TERMS, SURGE_ALIASES, surgeRows } from '../lib/boards/surgehq-cov2.ts';
const PAGE='https://surgehq.ai/benchmarks/gdp-pdf';
export default {
 benchmark:'gdp-pdf', url:PAGE, feed:PAGE, terms:SURGE_TERMS,aliases:SURGE_ALIASES,
 fetch:async()=>surgeRows(await fetchText(PAGE)),
} satisfies Leaderboard;
