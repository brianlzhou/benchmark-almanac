// scBench-Long evaluates long-horizon single-cell biology analysis.
// Table 2 reports completed-run pass rates across the original 21 final evaluations.
// This importer reads the original study paper and keeps the Wilson intervals and task counts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://benchmarks.bio/papers/scbench-long.pdf';
const rows: LeaderboardRow[] = [
  { model: 'Claude Opus 4.8', harness: 'Claude Code', score: 25.40, trials: 63, low: 16.28, high: 37.34, metrics: { passRuns: 16, anyPass: 8, majorityPass: 6, allPass: 2 } },
  { model: 'Gemini 3.5 Flash', harness: 'PI', score: 22.22, trials: 63, low: 13.72, high: 33.91, metrics: { passRuns: 14, anyPass: 8, majorityPass: 5, allPass: 1 } },
  { model: 'Claude Opus 4.8', harness: 'PI', score: 20.63, trials: 63, low: 12.48, high: 32.17, metrics: { passRuns: 13, anyPass: 8, majorityPass: 3, allPass: 2 } },
  { model: 'Gemini 3.1 Pro', harness: 'PI', score: 17.46, trials: 63, low: 10.04, high: 28.62, metrics: { passRuns: 11, anyPass: 8, majorityPass: 3, allPass: 0 } },
  { model: 'GPT-5.5', harness: 'OpenAI Codex', score: 15.87, trials: 63, low: 8.86, high: 26.81, metrics: { passRuns: 10, anyPass: 6, majorityPass: 2, allPass: 2 } },
  { model: 'GPT-5.5', harness: 'PI', score: 15.87, trials: 63, low: 8.86, high: 26.81, metrics: { passRuns: 10, anyPass: 6, majorityPass: 3, allPass: 1 } },
  { model: 'Claude Opus 4.7', harness: 'Claude Code', score: 11.11, trials: 63, low: 5.49, high: 21.20, metrics: { passRuns: 7, anyPass: 3, majorityPass: 2, allPass: 2 } },
  { model: 'Claude Opus 4.6', harness: 'PI', score: 9.52, trials: 63, low: 4.44, high: 19.26, metrics: { passRuns: 6, anyPass: 3, majorityPass: 2, allPass: 1 } },
  { model: 'Claude Opus 4.7', harness: 'PI', score: 9.52, trials: 63, low: 4.44, high: 19.26, metrics: { passRuns: 6, anyPass: 3, majorityPass: 2, allPass: 1 } },
  { model: 'GLM-5P2', harness: 'PI', score: 9.52, trials: 63, low: 4.44, high: 19.26, metrics: { passRuns: 6, anyPass: 4, majorityPass: 1, allPass: 1 } },
  { model: 'GPT-5.4', harness: 'PI', score: 9.52, trials: 63, low: 4.44, high: 19.26, metrics: { passRuns: 6, anyPass: 6, majorityPass: 0, allPass: 0 } },
  { model: 'Claude Opus 4.6', harness: 'Claude Code', score: 7.94, trials: 63, low: 3.44, high: 17.27, metrics: { passRuns: 5, anyPass: 3, majorityPass: 2, allPass: 0 } },
  { model: 'Claude Sonnet 4.6', harness: 'PI', score: 7.94, trials: 63, low: 3.44, high: 17.27, metrics: { passRuns: 5, anyPass: 4, majorityPass: 1, allPass: 0 } },
  { model: 'Grok 4.20', harness: 'PI', score: 6.35, trials: 63, low: 2.50, high: 15.22, metrics: { passRuns: 4, anyPass: 3, majorityPass: 1, allPass: 0 } },
  { model: 'Kimi K2P6', harness: 'PI', score: 5.00, trials: 60, low: 1.72, high: 13.70, metrics: { passRuns: 3, anyPass: 3, majorityPass: 0, allPass: 0 } },
  { model: 'GPT-5.4', harness: 'OpenAI Codex', score: 3.17, trials: 63, low: 0.88, high: 10.86, metrics: { passRuns: 2, anyPass: 1, majorityPass: 1, allPass: 0 } },
  { model: 'Grok 4.3', harness: 'PI', score: 1.59, trials: 63, low: 0.28, high: 8.46, metrics: { passRuns: 1, anyPass: 1, majorityPass: 0, allPass: 0 } },
];

const board: Leaderboard = {
  benchmark: 'scbench-long-original',
  static: 'paper',
  url: 'https://github.com/latchbio/scbench-long',
  feed: FEED,
  terms: 'The authors publish the paper and repository under Apache License 2.0. https://www.apache.org/licenses/LICENSE-2.0',
  async fetch() {
    const paper = await pdfText(FEED);
    if (!paper.includes('Table 2: Main verifiable results') || !paper.includes('Claude Opus 4.8 / Claude Code')) throw new Error('scBench-Long original Table 2 missing');
    return checked(rows, 17);
  },
};

export default board;
