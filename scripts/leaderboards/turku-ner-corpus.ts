// The Turku NER Corpus tests Finnish named entity recognition. Table 5 reports test-set F-score,
// precision and recall. Tables 6 and 7 break down FinBERT's F-score by entity type and text section.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2020.lrec-1.567.pdf';
const board: Leaderboard = {
  benchmark: 'turku-ner-corpus', static: 'paper', url: 'https://aclanthology.org/2020.lrec-1.567/', feed,
  terms: 'The authors link their corpus and publication at https://github.com/TurkuNLP/turku-ner-corpus.',
  stats: { precision: { name: 'Precision', unit: '%', better: 'higher' }, recall: { name: 'Recall', unit: '%', better: 'higher' } },
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/Method\s+Prec\.\s+Rec\.\s+F-score\s*\n([\s\S]*?)Table 5: Comparison of NER methods/);
    if (!table) throw new Error('Missing Turku NER Table 5');
    const rows: LeaderboardRow[] = [];
    for (const line of table[1].trim().split('\n')) {
      const [model, p, r, f] = line.trim().split(/\s{2,}/);
      if (model === 'FiNER tagger') continue; // Dictionary and rule system.
      rows.push({ model, score: Number(f), metrics: { precision: Number(p), recall: Number(r) } });
    }
    const section = paper.match(/Type\s+Prec\.\s+Rec\.\s+F-score\s+Section\s+Prec\.\s+Rec\.\s+F1-score([\s\S]*?)Table 7: BERT performance/);
    const finbert = rows.find(r => r.model === 'FinBERT');
    if (!section || !finbert) throw new Error('Missing FinBERT breakdowns');
    const parts: Record<string, string> = {};
    for (const m of section[1].matchAll(/(DATE|PER|LOC|ORG|PRO|EVENT|Financial news|Wikinews|Student magazine|Grammar example|Fiction|Wikipedia|University news|Legistlation|Europarl|Blog entry)\s+\d+\.\d+\s+\d+\.\d+\s+(\d+\.\d+)/g)) {
      const name = m[1] === 'Legistlation' ? 'Legislation' : m[1];
      parts[name] = name;
      finbert.metrics![name] = Number(m[2]);
    }
    if (Object.keys(parts).length !== 16) throw new Error('Incomplete FinBERT breakdown');
    board.parts = parts;
    return checked(rows, 3);
  },
};
export default board;
