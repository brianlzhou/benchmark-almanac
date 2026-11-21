// Ramp SWE-Bench v2: agents solve 500 tasks from Ramp's production backend, and a panel of model judges compares each
// patch with the code engineers merged. The score is pass@1, the share of tasks resolved. Ramp runs every model in a
// shared Bash harness (mini-SWE-agent, the page's v2.0 view) and the labs' own coding agents on the same tasks (Claude
// Code, Codex, OpenCode and others, the v2.1 view). Rows in a lab's agent are their own entries. Read through
// scripts/lib/boards/ramp-swebench.ts from the two results files the page loads.
import type { Leaderboard } from './types.ts';
import { RAMP_TERMS, rampRows } from '../lib/boards/ramp-swebench.ts';

const BASH = 'https://labs.ramp.com/swebench/v2/data/results.csv.gz?v=76a34ea52c9f9485';
const NATIVE = 'https://labs.ramp.com/swebench/v2/data/v21/results.csv.gz?v=2eb3d0363478edc5';

const board: Leaderboard = {
  benchmark: 'ramp-swe-bench-2',
  url: 'https://labs.ramp.com/swebench#leaderboard',
  feed: `${BASH} and ${NATIVE}`,
  terms: RAMP_TERMS,
  reference: ['mini-SWE-agent'],
  harnesses: 'system',
  stats: { latency: { name: 'Mean latency per task', unit: 'seconds', better: 'lower' }, toolCalls: { name: 'Mean tool calls per task', unit: 'count', better: 'lower' }, inputTokens: { name: 'Input tokens per task', unit: 'tokens' }, reasoningTokens: { name: 'Reasoning tokens per task', unit: 'tokens' }, tasks: { name: 'Tasks', unit: 'count' } },
  chart: { title: 'Score versus spend', x: { key: 'cost', label: 'Mean cost per task', unit: '$', better: 'lower', log: true }, y: { key: 'score', label: 'Resolved', unit: '%', better: 'higher' } },
  async fetch() {
    const bash = await rampRows(BASH, { ci95: true, minRows: 15 });
    const native = await rampRows(NATIVE, { ci95: true, minRows: 10 });
    return [...native, ...bash];
  },
};
export default board;
