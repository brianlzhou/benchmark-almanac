// ASDiv evaluates mathematical word-problem solvers. Table 3 reports answer accuracy
// on ASDiv and the arithmetic ASDiv-A subset for three published solver systems.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2020.acl-main.92.pdf';
const board: Leaderboard = {
  benchmark: 'asdiv', feed, url: feed, static: 'paper',
  terms: 'ACL Anthology terms apply to the authors’ paper. https://aclanthology.org/faq/copyright/',
  parts: { asdivA: 'ASDiv-A arithmetic subset', g1: 'Grade 1', g2: 'Grade 2', g3: 'Grade 3', g4: 'Grade 4', g5: 'Grade 5', g6: 'Grade 6' },
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/MathQA-C\s+ASDiv-A\s+ASDiv([\s\S]*?)Table 3: Accuracies for different systems/);
    const grades = paper.match(/G1\s+G2\s+G3\s+G4\s+G5\s+G6([\s\S]*?)Table 4: Performance of various grade levels/);
    if (!table || !grades) throw new Error('Missing ASDiv comparison or grade headers');
    const rows = [];
    for (const line of table[1].split('\n')) {
      const match = line.trim().match(/^([LUG])\s+(?:-|0\.\d+)\s+(0\.\d+)#?\s+(0\.\d+)#?(?:\s|$)/);
      if (!match) continue;
      const [, id, subset, overall] = match;
      const row = grades[1].split('\n').find(l => new RegExp('^\\s*' + id + '\\s+0\\.').test(l));
      if (!row) throw new Error('Missing grade breakdown for ' + id);
      const values = row.trim().split(/\s+/).slice(1, 7);
      if (values.length !== 6 || !values.every(v => /^0\.\d+$/.test(v))) throw new Error('Invalid grade scores');
      const metrics: Record<string, number> = { asdivA: Number(subset) * 100 };
      values.forEach((v, i) => { metrics['g' + (i + 1)] = Math.round(Number(v) * 100); });
      const names: Record<string, string> = { L: 'LCA++', U: 'UnitDep', G: 'GTS' };
      rows.push({ model: names[id], score: Number(overall) * 100, setting: 'Five-fold cross-validation',
        trials: id === 'G' ? 5 : undefined, metrics });
    }
    return checked(rows, 3);
  },
};
export default board;
