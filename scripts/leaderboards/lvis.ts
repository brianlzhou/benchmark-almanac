// LVIS tests large-vocabulary instance segmentation and detection.
// Figure 8's Mask R-CNN comparison reports box and mask AP on COCO and LVIS annotations.
// This importer reads the two clearly labeled LVIS baseline rows from the paper PDF.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/1908.03195';
const expected = [
  ['ResNet-50-FPN', 38.8, 34.4],
  ['ResNet-101-FPN', 40.9, 36.0],
] as const;

const board: Leaderboard = {
  benchmark: 'lvis',
  static: 'paper',
  url: 'https://arxiv.org/abs/1908.03195',
  feed,
  terms: 'Paper results read from arXiv. https://arxiv.org/abs/1908.03195',
  async fetch(): Promise<LeaderboardRow[]> {
    const paper = await pdfText(feed);
    const rows: LeaderboardRow[] = [];
    for (const [model, box, mask] of expected) {
      if (!paper.includes(model) || !paper.includes(String(box)) || !paper.includes(String(mask))) throw new Error('Missing LVIS baseline row: ' + model);
      rows.push({ model, score: mask, metrics: { boxAP: box } });
    }
    return checked(rows, 2);
  },
};

export default board;
