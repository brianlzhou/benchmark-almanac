// SpatialBench evaluates spatial reconstruction at different input densities. The main leaderboard lists average AbsRel first.
// AbsRel is absolute relative depth error. The importer uses complete averages and excludes parenthesized results that omit the dense regime.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/Ropedia/SpatialBench/HEAD/leaderboard.md';
const regimes = ['Single Frame', 'Sparse', 'Medium', 'Dense', 'Average'];
const measures = [['AbsRel'], ['AbsRel','AUC@30'], ...Array.from({length:3}, () => ['AbsRel','AUC@30','ATE','F-Score'])];
const columns = measures.flatMap((names,i) => names.map(name => ({ name, label: regimes[i] + ': ' + name })));
const board: Leaderboard = {
  benchmark: 'spatialbench-ropedia', url: 'https://github.com/Ropedia/SpatialBench/blob/HEAD/leaderboard.md', feed,
  headline: 'The board lists average absolute relative depth error first. Lower is better. The score includes the dense regime.',
  terms: 'The SpatialBench repository uses CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  parts: Object.fromEntries(columns.map(({ label,name }) => [label, { name: label, unit: 'score', better: ['AbsRel','ATE'].includes(name) ? 'lower' : 'higher' }])),
  async fetch() {
    const table = tables(await fetchText(feed)).find(t =>
      t[0]?.map(c => c.text).join('|') === ['Method','#Params (M)','Time (s)',...regimes].join('|')
      && t[1]?.map(c => c.text.split(' ')[0]).join('|') === columns.map(c => c.name).join('|'));
    if (!table) throw Error('Missing SpatialBench leaderboard columns');
    const rows = table.slice(2).flatMap(cells => {
      if (cells.length === 1 && cells[0].attrs.colspan === '18') return [];
      if (cells.length !== 18) throw Error('Invalid SpatialBench model row');
      if (cells[14].text.startsWith('(')) return [];
      const model = text(cells[0].html.replace(/&pi;<sup>3<\/sup>/g, 'π³').replace(/<sup>\*<\/sup>/g, '*'));
      const values = cells.slice(1).map(c => {
        const raw = text(c.html.replace(/<sup>.*?<\/sup>/g, ''));
        if (!/^\d+(?:\.\d+)?$/.test(raw)) throw Error('Invalid SpatialBench score: ' + model);
        return Number(raw);
      });
      return [{ model, params: values[0]/1000, score: values[13], metrics: { secondsPerSequence: values[1],
        ...Object.fromEntries(columns.map((c,i) => [c.label, values[i+2]])) } }];
    });
    return checked(rows, 24);
  },
};
export default board;
