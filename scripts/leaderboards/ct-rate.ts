// CT-RATE tests detection of 18 abnormalities on chest CT scans. Figure 4a lists AUROC first.
// Two transcriptions agreed on all 16 internal validation values. The image hash guards the transcription.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const feed = 'https://media.springernature.com/full/springer-static/image/art%3A10.1038%2Fs41551-025-01599-y/MediaObjects/41551_2025_1599_Fig4_HTML.png';
const board: Leaderboard = {
  benchmark: 'ct-rate', static: 'paper', feed, url: 'https://www.nature.com/articles/s41551-025-01599-y/figures/4',
  terms: 'The figure is subject to the rights statement at https://www.nature.com/articles/s41551-025-01599-y#rightslink.',
  headline: 'The headline is mean AUROC on the internal CT-RATE validation set, expressed as a percentage.',
  async fetch() {
    return checked(await chartRows(feed, '3c98a728d7b5c3182156a01a2e961788bc96f93306a6795ef72364d511fa4163', [
      { model: 'CT-Net', score: 62.9, metrics: { f1: 65.7, accuracy: 61.7, precision: 26.3 } },
      { model: 'CT-CLIP', setting: 'Zero-shot', score: 73.1, metrics: { f1: 70.7, accuracy: 66.8, precision: 32.3 } },
      { model: 'CT-CLIP (VocabFine)', score: 75.6, metrics: { f1: 73.8, accuracy: 70.5, precision: 35.3 } },
      { model: 'CT-CLIP (ClassFine)', score: 75.6, metrics: { f1: 72.4, accuracy: 68.9, precision: 33.9 } },
    ]), 4);
  },
};
export default board;
