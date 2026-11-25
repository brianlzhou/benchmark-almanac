// Top-MAGD tests genre classification of MIDI files using repeating note patterns.
// Table 6 ranks pattern configurations by AUC ROC and gives F1 and accuracy alongside it.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://repositori.upf.edu/bitstreams/4aef9065-3cec-4356-8d6f-3c0825e1a45b/download';
const board: Leaderboard = {
  benchmark: 'lakh-midi-top-magd-genre', static: 'paper', url: 'https://hdl.handle.net/10230/43405', feed,
  terms: 'Universitat Pompeu Fabra provides the paper under the terms listed at https://hdl.handle.net/10230/43405.',
  stats: { f1: { name: 'F1 measure', unit: 'score', better: 'higher', note: 'F1 measure for the genre classification configuration, from 0 to 1.' }, accuracy: { name: 'Accuracy', unit: 'score', better: 'higher', note: 'Classification accuracy for the configuration, from 0 to 1.' }, patterns: { name: 'Pattern count', unit: 'count' } },
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/topMAGD\s+MASD\s+Name\s+AUC ROC\s+F1 measure\s+Accuracy\s+AUC ROC\s+F1 measure\s+Accuracy\s+#patterns([\s\S]+?)Table 6:/);
    if (!table) throw new Error('Missing Top-MAGD results columns');
    const rows = table[1].trim().split(/\n/).map(line => {
      const id = line.match(/^\s*(Sia|P2)\s+−\s+(\d+)/);
      const values = [...line.matchAll(/([\d.]+)\s*\(\s*([\d.]+)\)/g)];
      if (!id || values.length !== 6) throw new Error('Unexpected pattern configuration');
      return { model: id[1], setting: 'Configuration ' + id[2], score: Number(values[0][1]), trials: 5,
        metrics: { aucStd: Number(values[0][2]), f1: Number(values[1][1]), f1Std: Number(values[1][2]),
          accuracy: Number(values[2][1]), accuracyStd: Number(values[2][2]), patterns: Number(line.trim().split(/\s+/).at(-1)) } };
    });
    return checked(rows, 10);
  },
};
export default board;
