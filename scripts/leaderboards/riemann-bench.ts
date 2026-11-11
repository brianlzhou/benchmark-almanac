// Riemann-bench (Surge AI): percentage solved on the primary live math leaderboard.
// Nearby previews for other benchmarks are excluded by the shared page parser.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { SURGE_TERMS, SURGE_ALIASES, surgeRows } from '../lib/boards/surgehq.ts';
const PAGE='https://surgehq.ai/benchmarks/riemann-bench';
export default {benchmark:'riemann-bench',url:PAGE,feed:PAGE,terms:SURGE_TERMS,aliases:SURGE_ALIASES,
 fetch:async()=>surgeRows(await fetchText(PAGE)),
} satisfies Leaderboard;
