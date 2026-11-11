// FACTS Benchmark Suite on Kaggle Benchmarks (Google DeepMind). The suite board's "Average" task, the FACTS
// Score over Parametric, Search, Multimodal and Grounding, is the score (a fraction, shown 0 to 100). The four
// part scores are breakdowns. Kaggle also publishes averages for incomplete component coverage, so
// retain component scores and their count for review rather than implying every row covers all four.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'facts-benchmark-suite',
  url: 'https://www.kaggle.com/benchmarks/google/facts',
  feed: kaggleFeed('google', 'facts'),
  terms: KAGGLE_TERMS,
  aliases: {},
  async fetch() {
    const rows = await kaggleRows('google', 'facts', 'Average', 100, {
      grounding: { task: 'Grounding Score', scale: 100 },
      multimodal: { task: 'Multimodal Score', scale: 100 },
      search: { task: 'Search Score', scale: 100 },
      parametric: { task: 'Parametric Score', scale: 100 },
    });
    for (const row of rows) {
      const metrics = row.metrics ??= {};
      metrics.components = ['grounding', 'multimodal', 'search', 'parametric'].filter(k => typeof metrics[k] === 'number').length;
    }
    return rows;
  },
};
export default board;
