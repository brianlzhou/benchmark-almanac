// OmniPhys tests physics understanding from problems and diagrams.
// Table 5 gives the full-set average score on a 0 to 100 scale for five models.
// Table 3 provides the same models' subject scores, reasoning quality and strict mastery rates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2608.25398';
const subjects = ['Acoustics','Optics','Mechanics','Thermodynamics','Electricity','Overall'];
const labels = subjects.flatMap(s => (s === 'Overall' ? ['S1','S2','S3','Pobj','Popen'] : ['S1','S2','S3']).map(m => s + ' ' + m));
const board: Leaderboard = {
  benchmark: 'omniphys', static: 'paper', feed, url: feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: { testMini: 'Test-Mini', ...Object.fromEntries(labels.map(l => [l.replace(' ',''), l])) },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const summary = tables.find(t => t[0]?.join('|') === 'Model|Full Set|Test-Mini|Drop');
    const details = tables.find(t => t[0]?.[1] === 'Acoustics' && t[0]?.at(-1) === 'Overall');
    if (!summary || !details || details[1].slice(1).some((c,i) =>
      details[0][i+1] + ' ' + c.replace(/[_{}]/g,'') !== labels[i])) throw Error('Missing OmniPhys results columns');
    const rows: LeaderboardRow[] = [];
    for (const [model, full, mini, drop] of summary.slice(1)) {
      if (model === 'Average') continue;
      const row = details.find(r => r[0].toLowerCase() === model.toLowerCase());
      if (!row || row.length !== labels.length + 1 || !drop.endsWith('%')) throw Error('Missing model scores: ' + model);
      const metrics = Object.fromEntries(labels.map((l,i) => [l.replace(' ',''), numberCell(row[i+1])]));
      rows.push({ model, score: numberCell(full), metrics: { ...metrics, testMini: numberCell(mini), drop: numberCell(drop.slice(0,-1)) } });
    }
    return checked(rows, 5);
  },
};
export default board;
