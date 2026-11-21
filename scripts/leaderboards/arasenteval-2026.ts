// AraSentEval tests sentiment classification and sentiment reversal across Arabic dialects.
// Table 1 ranks classifiers by macro F1. Table 2 evaluates different systems with different metrics.
// Section 5 identifies the models behind five of the Table 1 submissions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2026.osact-1.34.pdf';
const systems: Record<string, Pick<LeaderboardRow, 'model' | 'models' | 'harness'>> = {
  Musj1984: { model: 'AraBERT v2', models: ['AraBERT v2', 'BERT-Large Arabic'], harness: 'Mixture of Experts' },
  TTLab: { model: 'SARF' },
  CasbAI: { model: 'MARBERT', harness: 'Multi-seed ensemble with Stochastic Weight Averaging' },
  LinguArabic: { model: 'MARBERT', harness: 'Multi-stage preprocessing and confidence adjustment' },
  BDSI: { model: 'AraBERTv2', models: ['AraBERTv2', 'CAMeLBERT'], harness: 'Supervised contrastive learning' },
};
const board: Leaderboard = {
  benchmark: 'arasenteval-2026',
  url: 'https://aclanthology.org/2026.osact-1.34/',
  feed,
  terms: 'ACL Anthology distributes this paper under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  parts: { classification: 'Arabic Dialect Sentiment Analysis' },
  harnesses: 'system',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/Team\/Participant Name\s+Macro F1-Score([\s\S]*?)Table 1: Results of the submitted systems/);
    if (!table) throw new Error('AraSentEval Table 1 missing');
    const rows: LeaderboardRow[] = [];
    for (const line of table[1].split('\n')) {
      const match = line.match(/^\s*\d+\s+(.+?)\s{2,}(0\.\d{4})\b/);
      if (!match) continue;
      const [, submitter, value] = match;
      const system = systems[submitter];
      if (system) rows.push({ ...system, submitter, score: Number(value), metrics: { classification: Number(value) } });
    }
    return checked(rows, 5);
  },
};
export default board;
