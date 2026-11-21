// NPCBench tests nasopharyngeal carcinoma diagnosis and care. Table 1 mixes accuracy, patient success and a consultation rubric.
// The headline is strict CarePath success: the percentage of patients with correct pathology, T stage and all scored care decisions.
import type { Leaderboard, BoardPart } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2611.08369';
const columns = [
  ['G-Mem.', 'Guideline recall'], ['A-App.', 'Guideline application'], ['Path.', 'Pathology'],
  ['T-Stg.', 'MRI T staging'], ['N-Stg.', 'MRI N staging'], ['Seq.', 'MRI sequence'], ['Struct.', 'MRI structure'],
  ['C-Plan', 'Case planning'], ['Turn', 'Longitudinal revision per turn'], ['All-turn', 'Longitudinal revision all turns'],
  ['Care', 'CarePath care accuracy'], ['Strict', 'CarePath strict success'], ['C-Rub.', 'Consultation rubric'],
];
const board: Leaderboard = {
  benchmark: 'npcbench', static: 'paper', url: 'https://github.com/pidneuralode/NPCBench', feed,
  terms: PAPER_TERMS + ' https://arxiv.org/abs/2611.08369',
  headline: 'The paper gives no overall score. The headline is strict patient success on CarePath episodes.',
  parts: Object.fromEntries(columns.map(([key,name]) => [key, key === 'C-Rub.' ? {name,unit:'score',note:'Rubric score from 0 to 100.'} : {name}])) as Record<string,BoardPart>,
  async fetch() {
    const table = inlinePaperTables(await paperHtml(feed)).find(t => t.some(r => r.includes('G-Mem.') && r.includes('Strict')));
    const start = table?.findIndex(r => r.includes('G-Mem.'));
    if (!table || start === undefined || table[start].slice(1).join('|') !== columns.map(c => c[0]).join('|')) {
      throw new Error('Missing Table 1 columns');
    }
    const rows = [];
    for (const r of table.slice(start+1)) {
      if (new Set(r).size === 1) continue;
      if (r.length !== columns.length + 1) throw new Error('Unexpected model row: ' + r[0]);
      if (/^[-–—]$/.test(r[12])) continue;
      const metrics = Object.fromEntries(columns.map(([key],i) => [key,numberCell(r[i+1])]));
      const model = r[0].replace(/\s*[†‡].*$/, '').trim();
      rows.push({model,score:metrics.Strict,metrics});
    }
    return checked(rows,21);
  },
};
export default board;
