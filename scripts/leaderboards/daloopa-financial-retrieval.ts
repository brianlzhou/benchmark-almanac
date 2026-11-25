// Daloopa ranks financial retrieval by exact numerical agreement. Its published chart labels exact matches and several error tolerances, and its public CSV gives different counts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';

const feed = "https://daloopa.com/wp-content/uploads/2025/09/image-13.png";

const board: Leaderboard = {
  benchmark: "daloopa-financial-retrieval",
  url: "https://daloopa.com/blog/ai/open-source-benchmark-to-measure-llm-accuracy-in-financial-retrieval",
  feed,
  terms: "See the dataset license at https://huggingface.co/datasets/daloopa/financial-retrieval The publisher displays the chart publicly and its robots.txt is linked at https://daloopa.com/robots.txt.",
  aliases: { 'GPT-5 Thinking': 'gpt-5', 'Claude (Opus 4.1)': 'claude-opus-4-1' },
  stats: {
    tolerance1: { name: 'Within 1% tolerance', unit: '%', better: 'higher', note: 'Share of answers within 1% of the ground-truth figure.' },
    tolerance5: { name: 'Within 5% tolerance', unit: '%', better: 'higher', note: 'Share of answers within 5% of the ground-truth figure.' },
    tolerance20: { name: 'Within 20% tolerance', unit: '%', better: 'higher', note: 'Share of answers within 20% of the ground-truth figure.' },
  },
  async fetch() {
    const row = (model: string, harness: string, score: number, one: number, five: number, twenty: number): LeaderboardRow => ({
      model, harness, score, metrics: { tolerance1: one, tolerance5: five, tolerance20: twenty },
    });
    return checkedImageRows(feed, '5ee42ff2604d1cbf3ff92e70498bc3f76d457fdd3b4128f003d56f87429bddd3', [
      row('GPT-5 Thinking', 'ChatGPT', 64.2, 76.2, 81.8, 89.5),
      row('Claude (Opus 4.1)', 'Claude', 31.4, 67.5, 73.7, 86.3),
      row('Claude (Opus 4.1)', 'Claude + Daloopa MCP', 91.6, 94.7, 96.2, 97.2),
      row('Grok 4', 'Grok', 57.2, 70.3, 75.8, 84.7),
      row('Gemini 2.5 Pro', 'Gemini', 11.8, 20.5, 33.8, 58.0),
      row('Perplexity Finance', 'Perplexity Finance', 34.2, 50.2, 60.4, 73.5),
    ]);
  },
};

export default board;
