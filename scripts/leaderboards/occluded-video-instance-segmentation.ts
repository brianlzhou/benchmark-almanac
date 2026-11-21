// OVIS tests video instance segmentation under object occlusion.
// The paper's Table 2 reports overall AP on the OVIS test set for nine named methods.
// The other AP, recall and occlusion-level columns remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2102.01558';
const board: Leaderboard = {
  benchmark: 'occluded-video-instance-segmentation', static: 'paper',
  url: 'https://arxiv.org/abs/2102.01558', feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2102.01558',
  parts: {
    ap50: 'AP50', ap75: 'AP75', ar1: 'AR1', ar10: 'AR10', slight: 'Slight occlusion AP', moderate: 'Moderate occlusion AP', heavy: 'Heavy occlusion AP',
    validation_ap: 'Validation AP', validation_ap50: 'Validation AP50', validation_ap75: 'Validation AP75', validation_ar1: 'Validation AR1', validation_ar10: 'Validation AR10',
    validation_slightlyOccluded: 'Validation slight occlusion AP', validation_moderatelyOccluded: 'Validation moderate occlusion AP', validation_heavilyOccluded: 'Validation heavy occlusion AP',
    slightlyOccluded: 'Slight occlusion AP', moderatelyOccluded: 'Moderate occlusion AP', heavilyOccluded: 'Heavy occlusion AP',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    if (!text.includes('Table 2: Overall results of state-of-the-art methods on the OVIS dataset')) throw new Error('OVIS Table 2 missing');
    const values: Array<[string, number, number, number, number, number, number, number, number]> = [
      ['FEELVOS', 10.8, 23.4, 8.7, 9.0, 16.2, 18.9, 12.2, 2.0],
      ['IoUTracker+', 8.0, 18.4, 7.5, 5.9, 15.7, 12.8, 9.1, 2.1],
      ['MaskTrack R-CNN', 11.8, 25.4, 10.4, 7.9, 16.0, 22.7, 15.0, 3.5],
      ['SipMask', 11.7, 23.7, 10.5, 8.1, 16.6, 21.9, 13.9, 3.2],
      ['STEm-Seg', 14.4, 30.0, 13.0, 10.1, 20.6, 22.5, 16.8, 4.2],
      ['TraDeS', 12.0, 26.4, 10.8, 7.8, 14.6, 21.6, 14.1, 3.6],
      ['QueryVIS', 16.0, 33.7, 14.7, 9.6, 21.7, 26.3, 17.7, 4.5],
      ['STMask', 15.6, 32.5, 13.8, 9.1, 21.8, 25.4, 17.1, 6.3],
      ['CrossVIS', 16.3, 31.5, 15.4, 10.6, 21.1, 27.3, 18.5, 5.6],
    ];
    const rows = values.map(([model, score, ap50, ap75, ar1, ar10, slight, moderate, heavy]) => ({ model, score, metrics: { ap50, ap75, ar1, ar10, slight, moderate, heavy } }));
    return checked(rows, 9);
  },
};
export default board;
