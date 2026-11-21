// ADE20K tests semantic segmentation of scenes. The MIT CSAIL Performance table publishes an Overall Score,
// mean intersection over union, pixel accuracy and inference speed for each architecture and testing scale.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/CSAILVision/semantic-segmentation-pytorch/HEAD/README.md';
const headers = ['Architecture', 'MultiScale Testing', 'Mean IoU', 'Pixel Accuracy(%)', 'Overall Score', 'Inference Speed(fps)'];
const board: Leaderboard = {
  benchmark: 'ade20k', feed, url: 'https://github.com/CSAILVision/semantic-segmentation-pytorch#performance',
  terms: 'MIT CSAIL uses BSD 3-Clause, https://github.com/CSAILVision/semantic-segmentation-pytorch/blob/master/LICENSE.',
  stats: {
    meanIoU: { name: 'Mean intersection over union', unit: 'score', better: 'higher' },
    pixelAccuracy: { name: 'Pixel accuracy', unit: '%', better: 'higher' },
    fps: { name: 'Inference speed', unit: 'count', better: 'higher', note: 'Frames processed per second.' },
  },
  async fetch() {
    const source = (await fetchText(feed)).split('## Performance:')[1]?.split('</table>')[0];
    if (!source || Array.from(source.matchAll(/<th\b[^>]*>(.*?)<\/th>/g), m => text(m[1])).join('|') !== headers.join('|'))
      throw new Error('Missing ADE20K performance columns');
    let model = '';
    const rows = tables(source + '</table>')[0].map(row => {
      const cells = row.map(c => c.text);
      if (cells.length === 6) model = cells.shift()!;
      const [scale, ...values] = cells;
      if (!model || !['Yes', 'No'].includes(scale) || values.length !== 4 || !values.every(v => /^\d+(?:\.\d+)?$/.test(v)))
        throw new Error('Invalid architecture row');
      const [meanIoU, pixelAccuracy, score, fps] = values.map(Number);
      return { model, setting: scale === 'Yes' ? 'Multi-scale testing' : 'Single-scale testing', score, metrics: { meanIoU, pixelAccuracy, fps } };
    });
    return checked(rows, 18);
  },
};
export default board;
