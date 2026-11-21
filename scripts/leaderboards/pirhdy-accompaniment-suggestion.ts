// PiRhDy ranks accompaniment phrases for a melody. Figure 8 reports mean average precision and four hit rates.
// We transcribed the 20 chart labels twice and compared the passes. The PDF hash guards the transcription.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const feed = 'https://arxiv.org/pdf/2010.08091';
const board: Leaderboard = {
  benchmark: 'pirhdy-accompaniment-suggestion', static: 'paper', feed, url: 'https://arxiv.org/abs/2010.08091',
  terms: 'The chart is attributed to the paper authors under the arXiv distribution terms. https://arxiv.org/licenses/',
  parts: { hits1: 'HITS@1', hits5: 'HITS@5', hits20: 'HITS@20', hits25: 'HITS@25' },
  async fetch() {
    return checked(await chartRows(feed, '5d494e025ed2f9865dc1c34fb9f1798b4c7d6e93720dc796f65984377e4408ee', [
      { model: 'tonnetz', score: 0.423, metrics: { hits1: 0.101, hits5: 0.407, hits20: 0.628, hits25: 0.897 } },
      { model: 'pianoroll', score: 0.567, metrics: { hits1: 0.166, hits5: 0.541, hits20: 0.720, hits25: 0.921 } },
      { model: 'PiRhDy_GH', score: 0.651, metrics: { hits1: 0.211, hits5: 0.625, hits20: 0.812, hits25: 0.965 } },
      { model: 'PiRhDy_GM', score: 0.567, metrics: { hits1: 0.184, hits5: 0.540, hits20: 0.718, hits25: 0.919 } },
    ]), 4);
  },
};
export default board;
