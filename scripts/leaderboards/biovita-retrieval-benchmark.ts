// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Tables 3 and 6 report six-direction average top-1 accuracy for seen and unseen species.
// Table 5 separately checks whether models retrieve a different species in the same genus or family.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2603.23883';
const parts: Record<string, BoardPart> = {};
const board: Leaderboard = {
  benchmark: 'biovita-retrieval-benchmark', url: feed, feed, static: 'paper', parts,
  terms: 'The authors publish their tables on arXiv. https://arxiv.org/abs/2603.23883',
  headline: 'The paper reports no overall score, so this is the mean of its seen and unseen species top-1 averages.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid).filter(t => t[0].at(-1) === 'Average' && t[1]?.at(-1) === 'Top 5');
    const rows = new Map<string, LeaderboardRow>();
    for (const t of tables) {
      const higherTaxon = t[0][1] === 'Model';
      const seen = t.some(r => r[0] === 'Random');
      for (const r of t.slice(2)) {
        const offset = higherTaxon ? 2 : 1;
        const model = r[offset - 1].replace(/\\mathsf\{([^}]+)\}/g, '$1').replace(/\s*\[.*?\]/g, '').trim();
        if (model === 'Random' || r.at(-2) === '–') continue;
        const group = higherTaxon ? r[0] : seen ? 'Seen species' : 'Unseen species';
        const row = rows.get(model) ?? { model, score: 0, metrics: {} as Record<string,number> };
        for (let i = offset; i < r.length; i++) {
          const name = t[0][i].replace('\\rightarrow', ' to ') + ' ' + t[1][i];
          const key = (group + name).replaceAll(' ', '');
          parts[key] = { name: group + ': ' + name, group };
          row.metrics![key] = numberCell(r[i]);
        }
        rows.set(model, row);
      }
    }
    const complete = [...rows.values()].filter(r => r.metrics!.SeenspeciesAverageTop1 !== undefined && r.metrics!.UnseenspeciesAverageTop1 !== undefined);
    for (const r of complete) r.score = (r.metrics!.SeenspeciesAverageTop1 + r.metrics!.UnseenspeciesAverageTop1) / 2;
    return checked(complete, 3);
  },
};
export default board;
