// ImageNet-Sketch tests recognition of object classes in black-and-white sketches.
// The makers link to the timm results CSV, which ranks checkpoints by top-1 classification accuracy.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://raw.githubusercontent.com/huggingface/pytorch-image-models/HEAD/results/results-sketch.csv';
const board: Leaderboard = {
  benchmark: 'imagenet-sketch', url: 'https://github.com/huggingface/pytorch-image-models/blob/main/results/results-sketch.csv',
  feed, host: 'PyTorch Image Models',
  terms: 'PyTorch Image Models uses Apache-2.0. https://github.com/huggingface/pytorch-image-models/blob/main/LICENSE',
  async fetch() {
    const records = parseCsv(await fetchText(feed));
    const required = ['model', 'img_size', 'top1', 'top5', 'param_count', 'crop_pct', 'interpolation'];
    if (!required.every(k => k in (records[0] ?? {}))) throw new Error('ImageNet-Sketch CSV columns changed');
    const rows = records.map(r => ({
      model: r.model, score: numberCell(r.top1), params: numberCell(r.param_count.replace(/,/g, '')) / 1000,
      setting: r.img_size + ' px, crop ' + r.crop_pct + ', ' + r.interpolation,
      metrics: { top5: numberCell(r.top5) },
    }));
    return checked(rows, 1556);
  },
};
export default board;
