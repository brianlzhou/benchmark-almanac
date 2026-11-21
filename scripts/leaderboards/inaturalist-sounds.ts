// iNatSounds tests audio identification of animal species.
// Table 2 reports test mAP, the dataset's primary metric, plus mF1 and class-averaged top-1 and top-5 accuracy.
// Each cell reports the mean and standard deviation of three runs.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2506.00343';
const board: Leaderboard = {
  benchmark: 'inaturalist-sounds', url: feed, feed, static: 'paper',
  terms: 'The authors publish Table 2 at https://arxiv.org/abs/2506.00343.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.slice(0, 4).join('|') === 'Model|ML|MT|iNatSounds test' && t[1]?.slice(3, 7).join('|') === 'mAP|mF1|Top1|Top5');
    if (!table) throw new Error('Missing iNatSounds Table 2');
    const names: Record<string, string> = { MV3: 'MobileNet-V3-Large', R50: 'ResNet-50', ViT: 'ViT-B-16' };
    let model = '';
    const rows = table.slice(2).reverse().filter(r => r[4] !== '-').map(row => {
      // The HTML puts each three-row group's model label in the last row.
      if (row[0]) model = names[row[0]];
      if (!model) throw new Error('Unknown iNatSounds model');
      const metrics: Record<string, number> = {};
      for (const [i, key] of ['mAP', 'mF1', 'top1', 'top5'].entries()) {
        const pair = row[i + 3].split(' ').map(numberCell);
        if (pair.length !== 2) throw new Error('Expected a mean and standard deviation');
        metrics[key] = pair[0];
        metrics[key === 'mAP' ? 'std' : key + 'Std'] = pair[1];
      }
      const setting = row[1] === '✓' ? (row[2] === '✓' ? 'Multilabel with Mean Teacher' : 'Multilabel') : 'Multiclass';
      return { model, setting, score: metrics.mAP, trials: 3, metrics };
    });
    return checked(rows.reverse(), 9);
  },
};
export default board;
