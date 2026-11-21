// PHINC evaluates Hinglish-to-English translation against human references on a 100-sentence sample.
// Table 2 reports BLEU-1 on a 0 to 1 scale, word error rate and translation error rate.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://aclanthology.org/2020.wnut-1.7.pdf';
export default {
  benchmark: 'phinc', static: 'paper', url, feed: url, harnesses: 'system',
  terms: 'The ACL Anthology publishes the authors’ paper under CC BY 4.0. https://aclanthology.org/2020.wnut-1.7/',
  stats: { wer: { name: 'Word error rate', unit: 'score', better: 'lower', note: 'Error rate from 0 to 1.' }, ter: { name: 'Translation error rate', unit: 'score', better: 'lower', note: 'Translation error rate from 0 to 1.' } },
  async fetch() {
    const table = (await pdfText(url)).match(/BLEU-1\s+WER\s+TER([\s\S]+?)Table 2: Evaluation of machine translation systems/);
    if (!table) throw new Error('Missing PHINC Table 2');
    const rows = [...table[1].matchAll(/\b(BT|GT|PPGT)\s+(0\.\d+)\s+(0\.\d+)\s+(0\.\d+)/g)];
    return checked(rows.map(([, system, score, wer, ter]) => ({
      model: system === 'BT' ? 'Bing Translate' : 'Google Translate',
      ...(system === 'PPGT' ? { harness: 'PPGT' } : {}),
      score: Number(score), metrics: { wer: Number(wer), ter: Number(ter) },
    })), 3);
  },
} satisfies Leaderboard;
