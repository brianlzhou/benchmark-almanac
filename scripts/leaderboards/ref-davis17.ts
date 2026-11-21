// Ref-DAVIS17 tests video object segmentation from a natural-language description.
// The FindTrack authors compare methods on validation J&F, the mean of region overlap and boundary F-score.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { grid, paperTables, checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://suhwan-cho.github.io/FindTrack/';
export default {
  benchmark: 'ref-davis17', url, feed: url, host: 'FindTrack',
  terms: 'The FindTrack authors publish their comparison and reference the original methods. https://suhwan-cho.github.io/FindTrack/',
  stats: { jaccard: { name: 'Jaccard index', unit: '%', better: 'higher' }, boundaryF: { name: 'Boundary F-measure', unit: '%', better: 'higher' } },
  async fetch() {
    const t = paperTables(await fetchText(url)).map(grid).find(g => g[0]?.includes('Ref-DAVIS17'));
    if (!t) throw new Error('Missing FindTrack comparison');
    const col = t[0].indexOf('Ref-DAVIS17');
    if (t[1].slice(col, col+3).join('|') !== 'J & F|J|F') throw new Error('Missing Ref-DAVIS17 J&F');
    const rows = t.slice(2).filter(c => c[col] !== '–').map(c => {
      const [jf, j, f] = c.slice(col, col+3);
      if (!/^\d+(\.\d+)?$/.test(jf)) throw new Error('Missing J&F');
      const metrics: Record<string, number> = {};
      if (j !== '–') metrics.jaccard = Number(j);
      if (f !== '–') metrics.boundaryF = Number(f);
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid component score');
      const name = c[0].match(/^(.+?) \( N = (\d+)\)$/);
      return { model: name?.[1] ?? c[0], ...(name ? { setting: 'N = ' + name[2] } : {}), score: Number(jf), metrics };
    });
    return checked(rows, 14);
  },
} satisfies Leaderboard;
