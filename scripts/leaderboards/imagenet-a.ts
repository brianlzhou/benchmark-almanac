// ImageNet-A tests object classification on naturally occurring images that classifiers often misidentify.
// The timm validation CSV ranks pretrained checkpoints by top-1 accuracy on the adversarial subset.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://raw.githubusercontent.com/huggingface/pytorch-image-models/main/results/results-imagenet-a.csv';
const board: Leaderboard = {
  benchmark: 'imagenet-a', host: 'timm', url: 'https://github.com/huggingface/pytorch-image-models/tree/main/results', feed,
  terms: 'The repository uses Apache 2.0 at https://github.com/huggingface/pytorch-image-models/blob/main/LICENSE.',
  parts: { top5: { name: 'Top-5 accuracy', unit: '%' } },
  async fetch() {
    const entries = parseCsv(await fetchText(feed));
    const expected = ['model', 'img_size', 'top1', 'top1_err', 'top5', 'top5_err', 'param_count', 'crop_pct', 'interpolation', 'top1_diff', 'top5_diff', 'rank_diff'];
    if (!entries.length || !expected.every(field => field in entries[0])) throw new Error('Missing ImageNet validation columns');
    return checked(entries.map(row => ({
      model: row.model, score: numberCell(row.top1), params: numberCell(row.param_count.replaceAll(',', '')) / 1000,
      setting: row.img_size + ' px, ' + row.interpolation + ', crop fraction ' + row.crop_pct,
      metrics: { top5: numberCell(row.top5), top1Error: numberCell(row.top1_err), top5Error: numberCell(row.top5_err),
        top1Diff: Number(row.top1_diff), top5Diff: Number(row.top5_diff), rankDiff: Number(row.rank_diff) },
    })), 1556);
  },
};
export default board;
