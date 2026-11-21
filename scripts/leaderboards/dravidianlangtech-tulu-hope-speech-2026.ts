// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// The Tulu shared task classifies hope tone and hope type. Tables 8 and 9 report macro F1 for each team's best run.
// Section 5 and Tables 6 and 7 identify teams that used the same named backbone for both tasks.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2026.dravidianlangtech-1.10.pdf';
const models: Record<string, string> = { SSN_HopeNetters: 'XLM-RoBERTa', Tensor_Thunders: 'DistilBERT',
  CUETEuropa: 'IndicBERT', cantnlp: 'XLM-RoBERTa', PrimeLine: 'XLM-RoBERTa' };
const parts = { tone: 'Coarse-Grained Hope Tone Classification', type: 'Fine-Grained Hope Type Classification' };
const board: Leaderboard = {
  static: 'paper',
  benchmark: 'dravidianlangtech-tulu-hope-speech-2026', url: feed, feed,
  terms: 'ACL Anthology copyright and licensing. https://aclanthology.org/faq/copyright/',
  stats: {
    toneAccuracy: { name: 'Tone accuracy', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' },
    toneMacroF1: { name: 'Tone macro F1', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' },
    toneMacroPrecision: { name: 'Tone macro precision', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' },
    toneMacroRecall: { name: 'Tone macro recall', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' },
    toneRank: { name: 'Tone rank', unit: 'count', better: 'lower' },
    toneWeightedPrecision: { name: 'Tone weighted precision', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' },
    typeAccuracy: { name: 'Type accuracy', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' },
    typeMacroF1: { name: 'Type macro F1', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' },
    typeMacroPrecision: { name: 'Type macro precision', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' },
    typeMacroRecall: { name: 'Type macro recall', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' },
    typeRank: { name: 'Type rank', unit: 'count', better: 'lower' },
    typeWeightedPrecision: { name: 'Type weighted precision', unit: 'score', better: 'higher', note: 'Reported as a fraction from 0 to 1.' },
  },
  headline: 'Plain mean of the macro F1 scores on hope tone and hope type.', parts,
  async fetch() {
    const paper = await pdfText(feed);
    const results = new Map<string, Record<string, number>>();
    for (const [task, part] of [[1, 'tone'], [2, 'type']] as const) {
      const table = paper.split('Hope Speech Identification - Task ' + task + ' Results')[1]?.trim().split('\n\n')[0];
      if (!table || !/Accuracy\s+Macro Precision\s+Macro Recall\s+Weighted Precision\s+Macro F1-Score\s+Rank/.test(table)) throw new Error('Missing Tulu results');
      for (const line of table.split('\n').slice(1)) {
        const cells = line.trim().split(/\s{2,}/);
        const [, team, run, ...values] = cells;
        if (!Object.hasOwn(models, team)) continue;
        if (!/^Run \d+$/.test(run) || values.length !== 6 || values.some(v => !Number.isFinite(Number(v)))) throw new Error('Invalid Tulu run');
        const metrics = results.get(team) ?? {};
        if (part in metrics) throw new Error('Repeated team run');
        metrics[part] = Number(values[4]);
        ['Accuracy', 'MacroPrecision', 'MacroRecall', 'WeightedPrecision', 'MacroF1', 'Rank'].forEach((k, i) => { metrics[part + k] = Number(values[i]); });
        results.set(team, metrics);
      }
    }
    return checked([...results].filter(([, m]) => 'tone' in m && 'type' in m).map(([team, metrics]) =>
      ({ model: models[team], submitter: team, harness: team, metrics, score: (metrics.tone + metrics.type) / 2 })), 5);
  },
};
export default board;
