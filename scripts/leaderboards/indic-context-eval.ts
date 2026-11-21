// IndicContextEval ranks speech transcription by clamped word error rate. Read the authors' CSV for each prompt level and the paired named entity error rate.
import type { Leaderboard } from './types.ts';
import { parseCsv, fetchText } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/AI4Bharat/IndicContextEval/main/results/paper_results.csv";
const board: Leaderboard = {
  benchmark: "indic-context-eval",
  stats: { neer: { name: 'Named entity error rate', unit: '%', better: 'lower', note: 'Percentage of named entities that are missing or incorrect.' } },
  url: "https://github.com/AI4Bharat/IndicContextEval/blob/main/results/paper_results.csv",
  feed: FEED,
  terms: "Word error is capped at 200% per utterance. Named entity error measures missing or incorrect names. The dataset uses CC BY 4.0. https://huggingface.co/datasets/ai4bharat/IndicContextEval The raw file host has no robots.txt.",
  async fetch() {
    const sections = (await fetchText(FEED)).trim().split(/\r?\n\s*\r?\n/);
    const read = (title: string) => {
      const section = sections.find(s => s.startsWith('TABLE,') && s.split('\n')[0].includes(title));
      if (!section) throw new Error('Missing IndicContextEval table ' + title);
      return parseCsv(section.slice(section.indexOf('\n') + 1));
    };
    const baseline = read('Baseline @ L1'), wer = read('Clamped WER (%) by prompt'), neer = read('NEER (%) by prompt');
    if (baseline.length < 5 || wer.length !== 7 || neer.length !== 7) throw new Error('Incomplete IndicContextEval tables');
    const rows = [];
    for (const b of baseline) {
      const model = b.Model;
      if (!model || !b['Clamped WER'] || !b.NEER) throw new Error('Invalid baseline');
      for (const w of wer) {
        if (w.Level !== 'L1' && !(model in w)) continue;
        const e = neer.find(r => r.Level === w.Level);
        const score = Number(w.Level === 'L1' ? b['Clamped WER'] : w[model]);
        const entityError = Number(w.Level === 'L1' ? b.NEER : e?.[model]);
        if (!Number.isFinite(score) || !Number.isFinite(entityError)) throw new Error('Invalid prompt-level score');
        rows.push({ model, setting: w.Level + ': ' + w.Description, score, metrics: { neer: entityError } });
      }
    }
    if (rows.length < 29) throw new Error('Missing model and prompt combinations');
    return rows;
  },
};
export default board;
