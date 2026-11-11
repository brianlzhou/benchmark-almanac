// DAYJOB Finance (Surge AI): all-rubric-pass percentage on the primary finance board.
// Scores from previews for other DAYJOB tasks are excluded.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { SURGE_TERMS, SURGE_ALIASES, surgeRows } from '../lib/boards/surgehq-cov2.ts';
const PAGE='https://surgehq.ai/benchmarks/dayjob-finance';
export default {benchmark:'dayjob-finance',url:PAGE,feed:PAGE,terms:SURGE_TERMS,aliases:SURGE_ALIASES,
 fetch:async()=>surgeRows(await fetchText(PAGE)),
} satisfies Leaderboard;
