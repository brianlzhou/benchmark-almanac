// SpatialBench-Long evaluates long-horizon spatial biology analysis.
// Table 2 reports completed-run pass rates across the original 24 final evaluations.
// This importer reads the paper's fixed model and harness results with intervals and run metadata.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/pdf/2605.28065';
const rows: LeaderboardRow[] = [
  { model: 'Gemini 3.5 Flash', harness: 'Pi', score: 11.11, trials: 72, low: 5.74, high: 20.42, metrics: { passRuns: 8, anyPass: 5, majorityPass: 2, allPass: 1, costUsd: 1.7378, turns: 61.21 } },
  { model: 'GPT-5.5', harness: 'OpenAI Codex', score: 11.11, trials: 72, low: 5.74, high: 20.42, metrics: { passRuns: 8, anyPass: 4, majorityPass: 2, allPass: 2 } },
  { model: 'GPT-5.5', harness: 'Pi', score: 11.11, trials: 72, low: 5.74, high: 20.42, metrics: { passRuns: 8, anyPass: 5, majorityPass: 2, allPass: 1, costUsd: 2.0512, turns: 27.51 } },
  { model: 'Claude Opus 4.6', harness: 'Claude Code', score: 9.72, trials: 72, low: 4.79, high: 18.74, metrics: { passRuns: 7, anyPass: 4, majorityPass: 2, allPass: 1 } },
  { model: 'Claude Opus 4.7', harness: 'Claude Code', score: 8.33, trials: 72, low: 3.88, high: 17.01, metrics: { passRuns: 6, anyPass: 4, majorityPass: 1, allPass: 1 } },
  { model: 'Grok 4.20 beta', harness: 'Pi', score: 6.94, trials: 72, low: 3.00, high: 15.25, metrics: { passRuns: 5, anyPass: 2, majorityPass: 2, allPass: 1, costUsd: 0.2004, turns: 16.82 } },
  { model: 'Claude Opus 4.6', harness: 'Pi', score: 5.56, trials: 72, low: 2.18, high: 13.43, metrics: { passRuns: 4, anyPass: 4, majorityPass: 0, allPass: 0, costUsd: 2.0830, turns: 22.92 } },
  { model: 'Claude Opus 4.7', harness: 'Pi', score: 5.56, trials: 72, low: 2.18, high: 13.43, metrics: { passRuns: 4, anyPass: 2, majorityPass: 1, allPass: 1, costUsd: 1.4305, turns: 23.90 } },
  { model: 'Kimi K2P6', harness: 'Pi', score: 5.56, trials: 72, low: 2.18, high: 13.43, metrics: { passRuns: 4, anyPass: 2, majorityPass: 2, allPass: 0, costUsd: 0.5409, turns: 28.47 } },
  { model: 'GPT-5.4', harness: 'Pi', score: 5.56, trials: 72, low: 2.18, high: 13.43, metrics: { passRuns: 4, anyPass: 2, majorityPass: 1, allPass: 1, costUsd: 1.4742, turns: 42.88 } },
  { model: 'Claude Sonnet 4.6', harness: 'Pi', score: 4.17, trials: 72, low: 1.43, high: 11.55, metrics: { passRuns: 3, anyPass: 1, majorityPass: 1, allPass: 1, costUsd: 1.8940, turns: 36.74 } },
  { model: 'Gemini 3.1 Pro', harness: 'Pi', score: 4.17, trials: 72, low: 1.43, high: 11.55, metrics: { passRuns: 3, anyPass: 2, majorityPass: 1, allPass: 0, costUsd: 0.8596, turns: 38.67 } },
  { model: 'GPT-5.4', harness: 'OpenAI Codex', score: 4.17, trials: 72, low: 1.43, high: 11.55, metrics: { passRuns: 3, anyPass: 1, majorityPass: 1, allPass: 1 } },
  { model: 'Grok 4.3', harness: 'Pi', score: 4.17, trials: 72, low: 1.43, high: 11.55, metrics: { passRuns: 3, anyPass: 1, majorityPass: 1, allPass: 1, costUsd: 0.0195, turns: 8.61 } },
  { model: 'Gemini 2.5 Pro', harness: 'Pi', score: 1.39, trials: 72, low: 0.25, high: 7.46, metrics: { passRuns: 1, anyPass: 1, majorityPass: 0, allPass: 0, costUsd: 0.3108, turns: 17.50 } },
];

const board: Leaderboard = {
  benchmark: 'spatialbench-long-original',
  static: 'paper',
  url: 'https://arxiv.org/abs/2605.28065v1',
  feed: FEED,
  terms: 'The authors publish this arXiv paper under its access terms. https://info.arxiv.org/help/license/index.html',
  async fetch() {
    const paper = await pdfText(FEED);
    if (!paper.includes('Table 2: Deterministic final-answer performance') || !paper.includes('Gemini 3.5 Flash / Pi')) throw new Error('SpatialBench-Long original Table 2 missing');
    return checked(rows, 15);
  },
};

export default board;
