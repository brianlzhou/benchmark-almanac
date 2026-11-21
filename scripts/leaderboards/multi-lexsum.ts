// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Multi-LexSum tests legal case summarization. Tables 3 and 5 score long, short, and tiny summaries from source documents.
// The authors use ROUGE-2 for model comparisons and publish it in the trained-model release.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2206.10883';
const board: Leaderboard = {
  benchmark: 'multi-lexsum', url: feed, feed, static: 'paper',
  terms: 'Paper and license details at https://arxiv.org/abs/2206.10883.',
  headline: 'The paper reports no overall score, so this is the mean ROUGE-2 F1 across long, short, and tiny summaries.',
  parts: { long: 'Long summary', short: 'Short summary', tiny: 'Tiny summary' },
  async fetch() {
    const html = (await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '');
    const tables = flatPaperTables(html).map(grid);
    const table = tables.find(t => t[1]?.[0] === 'Models' && t[1].length === 18);
    const multitask = tables.find(t => t[0][0] === 'Lengths' && t[1]?.[1]?.startsWith('BART, Multitask:'));
    if (!table || !multitask) throw new Error('Missing source-document summarization tables');
    const lengths = ['long', 'short', 'tiny'];
    const columns = ['R-1_{f1}', 'R-2_{f1}', 'R-L_{f1}', 'BS_{f1}', 'Words'];
    function result(model: string, setting: string, groups: string[][]) {
      const metrics: Record<string, number> = {};
      groups.forEach((cells, i) => {
        const key = lengths[i];
        const [r1, r2, rl, bs, words] = cells.map(numberCell);
        Object.assign(metrics, { [key]: r2, [key+'R1']: r1, [key+'RL']: rl, [key+'BERTScore']: bs, [key+'Words']: words });
      });
      return { model, setting, score: (metrics.long + metrics.short + metrics.tiny) / 3, metrics };
    }
    const offsets = [1, 7, 13];
    if (offsets.some(i => table[1].slice(i, i+5).join() !== columns.join()) ||
        multitask[0].slice(2,7).join() !== columns.join() || multitask.slice(2,5).map(r => r[0]).join() !== 'L,S,T') {
      throw new Error('Summary length or metric columns changed');
    }
    const rows = table.slice(2).filter(r => !['First k Sent', 'Random k Sent'].includes(r[0])).map(r =>
      result(r[0], 'Single-task', offsets.map(i => r.slice(i, i+5))));
    rows.push(result('BART', 'Multitask', multitask.slice(2,5).map(r => r.slice(2,7))));
    return checked(rows, 7);
  },
};
export default board;
