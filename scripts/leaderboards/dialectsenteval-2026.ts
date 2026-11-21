// DialectSentEval tests Arabic sentiment classification and rewriting. Table 1 ranks classifiers by macro F1.
// Table 2 scores different rewriting runs using sentiment style accuracy, BLEU and chrF.
// Section 5.1 identifies the backbones for these classification submissions.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2026.arabicnlp-sharedtasks.172.pdf';
const models: Record<string, string[]> = {
  ALEXIS: ['MARBERTv2'], Axiom: ['MARBERTv2', 'AraBERTv2'], 'PTUK-NLP': ['MARBERT'],
  'NU-SentEval': ['MARBERTv2', 'AraBERTv02', 'QARiB'], 'Gradient Descenders': ['MARBERTv2'],
  'NAMAA Community': ['MARBERTv2', 'AraBERTv2', 'AraModernBERT'], faisalm93: ['MARBERTv2'], Lahja: ['MARBERT'],
};
const board: Leaderboard = {
  static: 'paper',
  benchmark: 'dialectsenteval-2026', url: feed + '#page=7', feed,
  terms: 'ACL Anthology copyright and licensing. https://aclanthology.org/faq/copyright/',
  headline: 'Macro F1 on Subtask 1, Arabic Dialect Sentiment Analysis.',
  parts: { classification: 'Arabic Dialect Sentiment Analysis' },
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/#\s+Team Name\s+CodaBench Username\s+Macro F1([\s\S]*?)Table 1: Official evaluation results for Subtask 1/);
    if (!table) throw new Error('Missing classification results');
    const rows = [];
    for (const line of table[1].trim().split('\n')) {
      if (!line.trim()) continue;
      const match = line.trim().match(/^\d+\s+(.+?)\s{2,}\S+\s+(0\.\d+)$/);
      if (!match) throw new Error('Invalid classification row');
      const [, team, value] = match;
      const backbones = models[team];
      if (!backbones) continue;
      rows.push({ model: backbones[0], models: backbones.length > 1 ? backbones : undefined, harness: team, submitter: team,
        score: Number(value), metrics: { classification: Number(value) } });
    }
    return checked(rows, 8);
  },
};
export default board;
