// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// NAVI tests image correspondences across object views. Table 5 reports precision for multiview and in-the-wild pairs.
// Its first correspondence metric uses a matching confidence threshold of 0.2.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2306.09109';
const keys = ['Precision', 'DenseRecall15px', 'Auc5', 'Auc10', 'Auc20'];
const header = ['Precision@0.2', 'Dense-Recall@15px', 'AUC@5', 'AUC@10', 'AUC@20'];
const board: Leaderboard = {
  benchmark: 'navi', url: feed, feed, static: 'paper',
  terms: 'The authors publish their results under the terms linked at https://arxiv.org/abs/2306.09109.',
  headline: 'The headline averages Precision@0.2 on multiview and in-the-wild image pairs.',
  parts: { multiviewPrecision: 'Multiview', wildPrecision: 'In-the-wild' },
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[1]?.[0] === 'Method' && t[1].length === 6 && header.every((h, i) => t[1][i + 1].startsWith(h)));
    if (!table) throw new Error('NAVI correspondence table missing');
    const rows: LeaderboardRow[] = [];
    for (const [model, ...cells] of table.slice(2)) {
      if (model.startsWith('SIFT +')) continue;
      const metrics: Record<string, number> = {};
      for (const [i, key] of keys.entries()) {
        const pair = cells[i].split('/').map(s => numberCell(s.trim()));
        if (pair.length !== 2) throw new Error('Expected a multiview and in-the-wild result');
        metrics['multiview' + key] = pair[0];
        metrics['wild' + key] = pair[1];
      }
      rows.push({ model, score: (metrics.multiviewPrecision + metrics.wildPrecision) / 2, metrics });
    }
    return checked(rows, 4);
  },
};
export default board;
