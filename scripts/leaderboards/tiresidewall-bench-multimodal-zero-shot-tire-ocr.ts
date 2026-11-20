// TireSidewall-Bench: Multimodal Zero-Shot Tire OCR (Kaggle Benchmarks, by inushathathsara): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'tiresidewall-bench-multimodal-zero-shot-tire-ocr',
  url: 'https://www.kaggle.com/benchmarks/inushathathsara/tiresidewall-bench-multimodal-zero-shot-tire-ocr',
  feed: kaggleFeed('inushathathsara', 'tiresidewall-bench-multimodal-zero-shot-tire-ocr'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('inushathathsara', 'tiresidewall-bench-multimodal-zero-shot-tire-ocr', "(Overall)", 1),
};
export default board;
