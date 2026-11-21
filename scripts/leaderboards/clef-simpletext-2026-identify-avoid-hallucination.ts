// SimpleText Task 2 tests whether models detect and avoid unsupported text in scientific simplifications.
// Table 1 ranks source-free detection submissions by document F1. Section 4.1 identifies this as the main detection setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://ceur-ws.org/Vol-4283/paper445.pdf';
const identities: Record<string, string> = {
  'AIIRLab crossencoder': 'DeBERTa',
  'AIIRLab SourceFree_Qwen3-4B': 'Qwen3-4B',
  'THM BertOnly_roberta': 'RoBERTa',
  'THM BertOnly_bert': 'BERT',
  'THM BertOnly_scibert': 'SciBERT',
  'SIM StdlibLogReg': 'StdlibLogReg',
};
const board: Leaderboard = {
  benchmark: 'clef-simpletext-2026-identify-avoid-hallucination', url: feed, feed,
  terms: 'The organizers publish this paper under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  stats: {
    precision: { name: 'Document precision', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
    recall: { name: 'Document recall', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
    sentenceF1: { name: 'Sentence F1', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
    sentencePrecision: { name: 'Sentence precision', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
    sentenceRecall: { name: 'Sentence recall', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
  },
  parts: { detection: 'Task 2.1 Detecting Overgeneration' },
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/\fTable 1\s+Results for CLEF 2026 SimpleText Task 2\.1 Detecting Overgeneration:([\s\S]*?)4\. Results/);
    if (!table || !/Document\s+Sentence\s+F1\s+Prec\s+Rec\s+F1\s+Prec\s+Rec/.test(table[1])) throw new Error('SimpleText Table 1 columns missing');
    const rows: LeaderboardRow[] = [];
    for (const line of table[1].split('\n')) {
      const [entry, count, ...scores] = line.trim().split(/\s{2,}/);
      const model = identities[entry];
      if (!model) continue;
      if (!/^\d+$/.test(count) || scores.length !== 6 || !scores.every(s => /^[01]\.\d+$/.test(s))) throw new Error('Invalid SimpleText row for ' + entry);
      const [score, precision, recall, sentenceF1, sentencePrecision, sentenceRecall] = scores.map(Number);
      rows.push({ model, score, submitter: entry.split(' ')[0], setting: 'Without source text', harness: entry.split(' ')[1],
        metrics: { detection: score, precision, recall, sentenceF1, sentencePrecision, sentenceRecall } });
    }
    return checked(rows, 6);
  },
};
export default board;
