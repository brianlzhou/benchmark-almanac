// JOKER 2024 evaluates English-to-French pun translation. Tables 2 and 3 follow BERTScore F1 order and also give BLEU for each run.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://ceur-ws.org/Vol-3740/paper-167.pdf#page=5";

function results(section: string, keys: string[]) {
  return section.trim().split(/\r?\n/).slice(1).filter((line) => line.trim()).map((line) => {
    const cells = line.trim().split(/\s+/);
    const values = cells.splice(-keys.length).map((v) => Number(v.replace('%', '')));
    if (values.length !== keys.length || !values.every(Number.isFinite) || !cells.length) throw new Error('Malformed JOKER run');
    return { model: cells.join(' '), metrics: Object.fromEntries(keys.map((key, i) => [key, values[i]])) };
  });
}

const board: Leaderboard = {
  benchmark: "clef-joker-2024-pun-translation", static: 'paper',
  url: "https://ceur-ws.org/Vol-3740/paper-167.pdf#page=5",
  feed: FEED,
  terms: "The authors publish this results table under CC BY 4.0. https://ceur-ws.org/Vol-3740/paper-167.pdf#page=1 CEUR-WS robots.txt permits this volume.",
  stats: { references: { name: 'References', unit: 'count' }, precision: { name: 'Precision', unit: '%', better: 'higher' }, recall: { name: 'Recall', unit: '%', better: 'higher' }, f1: { name: 'F1', unit: '%', better: 'higher' }, translations: { name: 'Translated texts', unit: 'count' }, bleu: { name: 'BLEU', unit: 'score', better: 'higher' }, bleu1: { name: 'BLEU-1', unit: 'score', better: 'higher' }, bleu2: { name: 'BLEU-2', unit: 'score', better: 'higher' }, bleu3: { name: 'BLEU-3', unit: 'score', better: 'higher' }, bleu4: { name: 'BLEU-4', unit: 'score', better: 'higher' } },
  async fetch() {
    const paper = await pdfText(FEED);
    const bleu = paper.split('BLEU results for pun translation from English into French (test data)')[1]?.split('Table 3')[0];
    const bert = paper.split('for pun translation from English into French (test data)').at(-1)?.split('BLEU scores of the UBO')[0];
    if (!bleu?.includes('BLEU_4') || !bert?.includes('F1')) throw new Error('Missing English-to-French results');
    const a = results(bleu, ['translations', 'bleu', 'bleu1', 'bleu2', 'bleu3', 'bleu4']);
    const b = results(bert, ['references', 'precision', 'recall', 'f1']);
    if (a.length < 18 || a.length !== b.length) throw new Error('Incomplete JOKER runs');
    return b.map(({ model, metrics }, i) => {
      if (a[i].model !== model) throw new Error('BLEU and BERTScore runs differ');
      return { model, setting: `${a[i].metrics.translations} translated texts`, score: metrics.f1, metrics: { ...metrics, ...a[i].metrics } };
    });
  },
};
export default board;
