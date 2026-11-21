// MC-TACO tests temporal commonsense. Table 2 reports question-level F1 and exact match on the full test set.
// The headline uses F1, the first column, in the paper's percentage-point scale.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/D19-1332.pdf';
const board: Leaderboard = {
  benchmark: 'mc-taco', static: 'paper', url: 'https://aclanthology.org/D19-1332/', feed,
  terms: 'The ACL Anthology publishes the paper under its copyright policy. https://aclanthology.org/faq/copyright/',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split(/System\s+F1\s+EM/)[1]?.split('Table 2: Summary')[0];
    if (!table) throw new Error('Missing MC-TACO Table 2');
    const rows = Array.from(table.matchAll(/ {2,}(ESIM \+ (?:GloVe|ELMo)|BERT(?: \+ unit normalization)?) +(\d+\.\d+) +(\d+\.\d+) *$/gm),
      ([, system, f1, em]) => ({ model: system.startsWith('BERT') ? 'BERT' : system,
        setting: system.includes('normalization') ? 'Unit normalization' : undefined,
        score: Number(f1), metrics: { exactMatch: Number(em) } }));
    return checked(rows, 4);
  },
};
export default board;
