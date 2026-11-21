// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Tables 3 and 4 give accuracy for materials science questions without and with images under the base reasoning method.
import type { BoardPart, Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2510.12171';
const names = ['Fail. Mech.', 'Fund. Mech.', 'Materials', 'Processes', 'Properties', 'Structures', 'Overall'];
const labels = ['Questions without images', 'Questions with images'];
const parts: Record<string, BoardPart> = {};
for (const group of labels) for (const name of names) parts[group + ' ' + name] = { name, group };
const board: Leaderboard = {
  benchmark: 'matscibench', url: feed, feed, static: 'paper', parts,
  headline: 'The paper reports two overall accuracies, so this is their plain mean for questions with and without images.',
  terms: 'The authors link the paper license at https://arxiv.org/abs/2510.12171.',
  async fetch() {
    const paper = await paperHtml(feed);
    const data = labels.map(label => {
      const figure = [...paper.matchAll(/<figure\b[^>]*class="[^"]*ltx_table[^"]*"[^>]*>([\s\S]*?)<\/figure>/g)]
        .find(f => f[1].includes('(' + label.toLowerCase() + ').'))?.[1];
      const t = figure && flatPaperTables(figure).map(grid)[0];
      if (!t || t[0].join('|') !== ['Model', ...names].join('|')) throw new Error('Missing results for ' + label);
      const scores = new Map<string, number[]>();
      for (const [model, ...cells] of t.slice(1)) {
        if (model.startsWith('+') || cells.every(c => c === model)) continue;
        if (cells.length !== 7 || scores.has(model)) throw new Error('Invalid MatSciBench row: ' + model);
        scores.set(model, cells.map(numberCell));
      }
      return scores;
    });
    const rows = [...data[1]].map(([model, images]) => {
      const text = data[0].get(model);
      if (!text) throw new Error('Missing text comparison for ' + model);
      return { model, score: (text[6] + images[6]) / 2, setting: 'Base reasoning method',
        metrics: Object.fromEntries(Object.keys(parts).map((key, i) => [key, [...text, ...images][i]])) };
    });
    return checked(rows, 7);
  },
};
export default board;
