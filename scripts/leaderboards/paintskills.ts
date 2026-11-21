// PaintSkills tests text-to-image models on object recognition, counting and spatial relations.
// Table 2 reports the DETR evaluator's overall average accuracy for three named image models.
// The three skill accuracies remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2202.04053';
const board: Leaderboard = {
  benchmark: 'paintskills', static: 'paper', url: 'https://arxiv.org/abs/2202.04053', feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2202.04053',
  parts: { object: 'Object recognition', count: 'Object counting', spatial: 'Spatial relation understanding' },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    if (!text.includes('Table 2. DETR evaluation on images generated from the T2I')) throw new Error('PaintSkills Table 2 missing');
    const values: Array<[string, number, number, number, number]> = [
      ['DALL-ESmall', 57.5, 18.2, 2.4, 26.0],
      ['minDALL-E', 89.9, 47.5, 50.7, 62.7],
      ['Stable Diffusion', 96.2, 37.8, 7.9, 47.3],
    ];
    const rows = values.map(([model, object, count, spatial, score]) => ({ model, score, metrics: { object, count, spatial } }));
    return checked(rows, 3);
  },
};
export default board;
