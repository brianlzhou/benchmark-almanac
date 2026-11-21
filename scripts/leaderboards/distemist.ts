// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// DisTEMIST tests Spanish disease recognition and linking. BioASQ reports micro-F1 for both tasks.
// Table 6 pairs the SINAI variants and the BSC baselines by name: https://ceur-ws.org/Vol-3180/paper-11.pdf
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://participants-area.bioasq.org/results/DisTEMIST/';
const board: Leaderboard = {
  benchmark: 'distemist', url: feed, feed, parts: { entities: 'Disease recognition', linking: 'Disease linking' },
  terms: 'Copyright BioASQ Challenge. https://participants-area.bioasq.org/results/DisTEMIST/',
  stats: {
    entitiesPrecision: { name: 'Disease recognition precision', unit: 'score', better: 'higher', note: 'Micro-precision for disease recognition, from 0 to 1.' },
    entitiesRecall: { name: 'Disease recognition recall', unit: 'score', better: 'higher', note: 'Micro-recall for disease recognition, from 0 to 1.' },
    linkingPrecision: { name: 'Disease linking precision', unit: 'score', better: 'higher', note: 'Micro-precision for disease linking, from 0 to 1.' },
    linkingRecall: { name: 'Disease linking recall', unit: 'score', better: 'higher', note: 'Micro-recall for disease linking, from 0 to 1.' },
  },
  async fetch() {
    const result = tables(await fetchText(feed)).filter(t => t[0]?.map(c => c.text).join('|') === 'Team Name|System name|MiP|MiR|MiF1');
    if (result.length !== 2) throw new Error('Expected both BioASQ result tables');
    const systems = [
      ['SINAI', 'run1-clinical_model'], ['SINAI', 'run2-biomedical_model'],
      ['BSC', 'DiseaseTagIt-VT'], ['BSC', 'DiseaseTagIt-Base'],
    ];
    return checked(systems.map(([submitter, model]) => {
      const metrics: Record<string,number> = {};
      for (const [i, key] of ['entities', 'linking'].entries()) {
        const name = model + (i === 1 && submitter === 'SINAI' ? '.prepro' : '');
        const row = result[i].find(r => r[0].text === submitter && r[1].text === name);
        if (!row || row.length !== 5 || !row.slice(2).every(c => /^\d+\.\d+$/.test(c.text))) {
          throw new Error('Missing DisTEMIST result for ' + name);
        }
        metrics[key] = Number(row[4].text);
        metrics[key + 'Precision'] = Number(row[2].text);
        metrics[key + 'Recall'] = Number(row[3].text);
      }
      return { model, submitter, score: (metrics.entities + metrics.linking)/2, metrics };
    }), 4);
  },
};
export default board;
