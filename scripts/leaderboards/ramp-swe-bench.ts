// Ramp SWE-Bench v1: agents in the mini-SWE-agent harness change Ramp's backend code to meet engineering requests,
// and hidden tests from the merged pull request decide each task. The score is pass@1, the share of the 78 scored
// tasks resolved. Read through scripts/lib/boards/ramp-swebench.ts from the results file the v1 page loads.
import type { Leaderboard } from './types.ts';
import { RAMP_TERMS, rampRows } from '../lib/boards/ramp-swebench.ts';

const FILE = 'https://labs.ramp.com/swebench/data/results.csv.gz?v=1742b69260ebc328';

const board: Leaderboard = {
  benchmark: 'ramp-swe-bench',
  url: 'https://labs.ramp.com/swebench/v1',
  feed: FILE,
  terms: RAMP_TERMS,
  reference: ['mini-SWE-agent'],
  stats: { latency: { name: 'Mean latency per task', unit: 'seconds', better: 'lower' }, toolCalls: { name: 'Mean tool calls per task', unit: 'count', better: 'lower' }, inputTokens: { name: 'Input tokens per task', unit: 'tokens' }, reasoningTokens: { name: 'Reasoning tokens per task', unit: 'tokens' }, tasks: { name: 'Tasks', unit: 'count' } },
  chart: { title: 'Score versus spend', x: { key: 'cost', label: 'Mean cost per task', unit: '$', better: 'lower', log: true }, y: { key: 'score', label: 'Resolved', unit: '%', better: 'higher' } },
  fetch: () => rampRows(FILE, { ci95: false, minRows: 20 }),
};
export default board;
