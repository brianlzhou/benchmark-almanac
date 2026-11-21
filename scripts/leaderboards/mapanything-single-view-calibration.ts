// MapAnything single-view calibration tests camera calibration from one image.
// Table 3 reports average angular error in degrees, so lower values are better.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2509.13414';
export default {
  benchmark: 'mapanything-single-view-calibration', url: feed, feed, static: 'paper',
  terms: 'Paper and license at https://arxiv.org/abs/2509.13414',
  parts: { eth3d: 'ETH3D', snPlusPlusV2: 'SN++v2', tav2: 'TAV2' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === 'Methods|Avg.|ETH3D|SN++v2|TAV2');
    if (!table) throw new Error('Missing MapAnything calibration table');
    const rows = table.slice(1).map(([model, avg, eth3d, snPlusPlusV2, tav2]) => ({
      model, score: Number(avg), metrics: {
        eth3d: Number(eth3d), snPlusPlusV2: Number(snPlusPlusV2), tav2: Number(tav2),
      },
    }));
    if (rows.some(r => !r.model || Object.values(r.metrics).some(v => !Number.isFinite(v)) || !Number.isFinite(r.score))) {
      throw new Error('Invalid MapAnything calibration row');
    }
    return checked(rows, 4);
  },
} satisfies Leaderboard;
