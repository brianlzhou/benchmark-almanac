// LayMaker tests simplification of clinical notes. Simplification Gain is the difference between successful
// and failed judgments divided by the total. Table 3 gives the counts and gain, and Table 4 gives BLEU and SARI.
import type { Leaderboard } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2112.12672';
const board: Leaderboard = {
  benchmark: 'laymaker-mtsamples', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  stats:{success:{name:'Successful judgments',unit:'count'},failure:{name:'Failed judgments',unit:'count'},equal:{name:'Equal judgments',unit:'count'},neither:{name:'Neither judgments',unit:'count'},unchanged:{name:'Unchanged judgments',unit:'count'},bleu:{name:'BLEU',unit:'score',better:'higher'},sari:{name:'SARI',unit:'score',better:'higher'},g1:{name:'G1 score',unit:'%',better:'higher'},g2:{name:'G2 score',unit:'%',better:'higher'},g3:{name:'G3 score',unit:'%',better:'higher'},meaning:{name:'Meaning score',unit:'%',better:'higher'}},
  async fetch() {
    const tables = paperTables(await paperHtml(url)).map(grid);
    const main = tables.find(t => t[0].join('|') === '|S|F|E|N|U|SG');
    const reference = tables.find(t => t[0][1] === 'BLEU' && t[0][2] === 'SARI');
    const quality = tables.find(t => t[0].join('|') === '|G1|G2|G3|M');
    if (!main || !reference || !quality) throw new Error('Missing LayMaker results');
    return checked(main.slice(1).filter(row => row[0] !== 'Human').map(row => {
      const model = row[0];
      const r = reference.find(c => c[0] === model);
      const q = quality.find(c => c[0].replace('GPT2', 'GPT-2') === model);
      if (!r || !q || row.length !== 7) throw new Error('Missing metrics for ' + model);
      const counts = row.slice(1, 6).map(v => numberCell(v.replace(/\\mathbf|[{},\\\s]/g, '')));
      const [g1, g2, g3, meaning] = q.slice(1).map(v => numberCell(v.replace(/%$/, '')));
      const [success, failure, equal, neither, unchanged] = counts;
      const harness = ['n-gram', 'GPT-1', 'GPT-2'].includes(model) ? 'LayMaker' : undefined;
      return { model, harness, score: numberCell(row[6]), metrics: { success, failure, equal, neither, unchanged,
        bleu: numberCell(r[1]), sari: numberCell(r[2]), g1, g2, g3, meaning } };
    }), 6);
  },
};
export default board;
