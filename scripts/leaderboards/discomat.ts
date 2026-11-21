// DiSCoMaT tests extraction of material compositions from scientific tables.
// Table 1 reports material-level F1 as the final composition-extraction score.
// This importer reads the authors' ACL Anthology PDF and keeps the other F1 columns.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2023.acl-long.753.pdf';
const board: Leaderboard = {
  benchmark: 'discomat',
  feed,
  url: 'https://aclanthology.org/2023.acl-long.753/',
  static: 'paper',
  terms: 'ACL Anthology papers are available under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  stats: { constraintViolations: { name: 'Constraint violations', unit: 'count', better: 'lower' }, idF1: { name: 'Identification F1', unit: '%', better: 'higher' }, tupleF1: { name: 'Tuple F1', unit: '%', better: 'higher' } },
  async fetch() {
    const paper = await pdfText(feed);
    const section = paper.split('Table 1: Performance of V-D I SC O M AT')[0].split('13472').at(-1);
    if (!section) throw new Error('Missing DiSCoMaT Table 1');
    const rows = [
      ['TA PAS', 'TA PAS', 80.37, 71.23, 49.88, 4.78, 0.77, 0.10, 543.67],
      ['TA PAS-ADAPTED', 'TA PAS -A DAPTED', 89.65, 70.91, 57.88, 0.46, 3.79, 2.73, 490.33],
      ['TA BERT', 'TA BERT', 79.61, 58.20, 47.05, 8.25, 1.79, 1.50, 1729.67],
      ['TA BERT-ADAPTED', 'TA BERT-A DAPTED', 85.07, 59.31, 50.10, 6.28, 0.67, 2.86, 1195.67],
      ['TABBIE', 'TABBIE', 80.99, 50.90, 47.03, 2.41, 3.34, 2.14, 388.00],
      ['TABBIE-ADAPTED', 'TABBIE-A DAPTED', 80.18, 53.20, 48.89, 5.38, 5.57, 2.73, 728.67],
      ['V-DiSCoMaT', 'V-D I SC O M AT', 77.38, 76.52, 64.71, 12.21, 2.37, 3.45, 626.33],
    ];
    for (const [, source] of rows) if (!section.includes(String(source))) throw new Error('Missing DiSCoMaT model ' + source);
    return checked(rows.map(([model, , idF1, tupleF1, score, idStd, tupleStd, std, violations]) => ({
      model: String(model),
      score: Number(score),
      metrics: { idF1: Number(idF1), tupleF1: Number(tupleF1), std: Number(std), idStd: Number(idStd), tupleStd: Number(tupleStd), constraintViolations: Number(violations) },
    })), 7);
  },
};
export default board;
