// STAGE evaluates cross-scene narrative evolution reasoning on screenplay question answering.
// Table 3 reports eight model backbones with retrieval strategies, and Hybrid RAG is the first strategy listed.
// This importer uses Hybrid RAG average accuracy as the headline and keeps Pass@5 as a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2601.08510';
const board: Leaderboard = {
  benchmark: 'stage-cross-scene-narrative-evolution-reasoning', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2601.08510',
  headline: 'Table 3 lists Hybrid RAG first, so this is its average accuracy on the full Task II release.',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await paperHtml(feed);
    if (!text.includes('Cross-Scene Narrative Evolution Reasoning results')) throw new Error('STAGE Table 3 missing');
    const rows = [
      { model: 'Qwen3-8B', setting: 'Hybrid RAG', score: 42.4, metrics: { passAt5: 46.1 } },
      { model: 'Qwen3-30B-A3B', setting: 'Hybrid RAG', score: 51.5, metrics: { passAt5: 55.3 } },
      { model: 'Qwen3-235B', setting: 'Hybrid RAG', score: 60.8, metrics: { passAt5: 63.7 } },
      { model: 'Llama-3.1-8B', setting: 'Hybrid RAG', score: 38.1, metrics: { passAt5: 41.3 } },
      { model: 'Llama-3.1-70B', setting: 'Hybrid RAG', score: 51.6, metrics: { passAt5: 55.8 } },
      { model: 'GPT-5.5', setting: 'Hybrid RAG', score: 62.5, metrics: { passAt5: 65.0 } },
      { model: 'Gemini 3.1 Pro', setting: 'Hybrid RAG', score: 61.2, metrics: { passAt5: 63.9 } },
      { model: 'Claude Sonnet 4.6', setting: 'Hybrid RAG', score: 61.6, metrics: { passAt5: 65.1 } },
    ];
    return checked(rows, 8);
  },
};
export default board;
