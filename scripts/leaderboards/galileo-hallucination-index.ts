// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Galileo's 2023 charts measure context adherence with retrieval and correctness without retrieval and in long-form generation.
// Two transcriptions of all 33 printed values agreed. Each chart is guarded by its SHA-256.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const base = 'https://user-images.githubusercontent.com/138050654/';
const charts = [
  ['283152708-7ef81e54-7b40-4f4d-b416-90c414f877bd.png', 'e309caebf94616c42534c46f920d3ac8333fac61029e5000594df7552da74040'],
  ['283152214-e30b0b6c-1fa2-4484-88b2-5a554903bc93.png', '17d1214b24c6b47951f6dbdc3534a2fc21103cae63b14b75c3c159f3bceb35c2'],
  ['283153011-e4cb1107-7e61-4032-879c-3644819482d5.png', '35fd58aea4fdb2671630770e383e8e89c2591e3a21738be827552963454ca2bb'],
];
const values: [string, number, number, number][] = [
  ['gpt-4-0613', 0.76, 0.77, 0.83],
  ['gpt-3.5-turbo-0613', 0.75, 0.70, 0.81],
  ['gpt-3.5-turbo-1106', 0.74, 0.74, 0.82],
  ['zephyr-7b-beta', 0.71, 0.60, 0.74],
  ['gpt-3.5-turbo-instruct', 0.68, 0.70, 0.74],
  ['llama-2-70b-chat', 0.68, 0.65, 0.82],
  ['llama-2-13b-chat', 0.68, 0.59, 0.79],
  ['mistral-7b-instruct-v0.1', 0.67, 0.59, 0.65],
  ['llama-2-7b-chat', 0.65, 0.52, 0.72],
  ['falcon-40b-instruct', 0.60, 0.59, 0.70],
  ['mpt-7b-instruct', 0.58, 0.40, 0.53],
];
const url = 'https://github.com/rungalileo/hallucination-index/blob/main/hallucination-index-2023.md';
const board: Leaderboard = {
  benchmark: 'galileo-hallucination-index', url, feed: base + charts[0][0],
  terms: 'Galileo publishes the 2023 rankings in its public index. ' + url,
  aliases: { 'gpt-4-0613': 'gpt-4-jun-2023', 'gpt-3.5-turbo-0613': 'gpt-3-5-turbo-jun-2023', 'gpt-3.5-turbo-1106': 'gpt-3-5-turbo-nov-2023',
    'llama-2-70b-chat': 'llama-2-70b', 'llama-2-13b-chat': 'llama-2-13b', 'llama-2-7b-chat': 'llama-2-7b' },
  parts: { rag: 'Q&A with RAG', qa: 'Q&A without RAG', longForm: 'Long-Form Text Generation' },
  async fetch() {
    for (const [index, [file, hash]] of charts.entries()) {
      if (index) await new Promise(resolve => setTimeout(resolve, 1000));
      await chartRows(base + file, hash, []);
    }
    return checked(values.map(([model, rag, qa, longForm]) => ({
      model, score: (rag + qa + longForm) / 3, metrics: { rag, qa, longForm },
    })), 11);
  },
};
export default board;
