// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// SciCap tests scientific figure captioning. Table 3 scores three CNN+LSTM variants by BLEU-4 on three caption collections.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2021.findings-emnlp.277.pdf';
const parts = {first: 'First Sentence', single: 'Single-Sent Caption', limited: 'Caption w/ <=100 words'};
const board: Leaderboard = {
  benchmark: 'scicap', static: 'paper', url: 'https://aclanthology.org/2021.findings-emnlp.277/', feed,
  terms: 'ACL Anthology copyright and licensing terms apply. https://aclanthology.org/info/copyright/',
  headline: 'The paper reports no overall score, so this is the plain mean of BLEU-4 across its three caption collections.',
  parts,
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split(/Data Collection\s+Feature\s+BLEU-4/)[1]?.split('Table 3:')[0];
    if (!table || !Object.values(parts).every(name => table.includes(name))) throw new Error('SciCap Table 3 changed');
    const matches = Array.from(table.matchAll(/^\s*(Vision Only|Vision\+Text|Text Only)\s+(\.\d+)\b/gm));
    if (matches.length !== 9) throw new Error('Expected nine feature and collection scores');
    const rows = ['Vision Only', 'Vision+Text', 'Text Only'].map((model, i) => {
      const values = Object.keys(parts).map((key, j) => {
        const match = matches[3 * j + i];
        if (match[1] !== model) throw new Error('SciCap feature order changed');
        return [key, Number(match[2])] as const;
      });
      return {model: 'CNN+LSTM (' + model + ')', metrics: Object.fromEntries(values), score: values.reduce((sum, [, score]) => sum + score, 0) / values.length};
    });
    return checked(rows, 3);
  },
};
export default board;
