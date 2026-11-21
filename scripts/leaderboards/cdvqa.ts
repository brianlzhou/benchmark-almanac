// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// CDVQA asks questions about changes in pairs of aerial images. Tables I to VI report overall and
// per-question-type accuracy on two tests with different answer distributions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';

const feed = 'https://arxiv.org/html/2112.06343';
const board: Leaderboard = {
  benchmark: 'cdvqa', url: feed, feed, static: 'paper',
  terms: 'Results credited to Zhenghang Yuan and colleagues. https://arxiv.org/abs/2112.06343',
  headline: 'The paper reports two overall accuracies. The headline gives each test set equal weight.',
  async fetch() {
    const html = await paperHtml(feed);
    const rows = new Map<string, LeaderboardRow>();
    board.parts = {};
    for (const match of html.matchAll(/<figure\b[^>]*class="[^"]*ltx_table[^"]*"[^>]*>([\s\S]*?)<\/figure>/g)) {
      const caption = text(match[1].match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1] ?? '');
      const split = caption.match(/test set ([12])/i)?.[1];
      if (!split) continue;
      const t = grid(flatPaperTables(match[1])[0]);
      if (t.length !== 11 || t.at(-1)?.[0] !== 'Overall Accuracy') throw new Error('Missing accuracy rows');
      for (let i = 1; i < t[0].length; i++) {
        const col = t[0][i];
        const backbone = t[0][0] === 'Question Types' && !col.includes('CEM');
        const model = backbone ? col : 'ResNet-101';
        const setting = backbone || col.startsWith('Concat') || col === 'w/o CEM' ? 'Concatenation' : col.split(' \\')[0];
        const key = model + '/' + setting;
        const row = rows.get(key) ?? { model, setting, score: NaN, metrics: {} };
        for (const [label,...cells] of t.slice(1)) {
          const name = 'Test set ' + split + ': ' + label;
          const value = 100 * numberCell(cells[i-1]);
          if (row.metrics![name] !== undefined && row.metrics![name] !== value) throw new Error('Conflicting results for ' + key);
          row.metrics![name] = value;
          board.parts[name] = { name, unit: '%' };
        }
        rows.set(key,row);
      }
    }
    for (const row of rows.values()) row.score = (row.metrics!['Test set 1: Overall Accuracy'] + row.metrics!['Test set 2: Overall Accuracy']) / 2;
    return checked([...rows.values()], 9);
  },
};
export default board;
