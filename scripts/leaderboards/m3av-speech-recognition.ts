// M³AV Speech Recognition tests named-entity-heavy speech recognition.
// Table 5 reports test-set word error rate for seven ASR models, with CER and BWER as metrics.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2024.acl-long.489.pdf';
const board: Leaderboard = {
  benchmark: 'm3av-speech-recognition', url: 'https://aclanthology.org/2024.acl-long.489/', feed, static: 'paper',
  terms: 'ACL Anthology terms apply. https://aclanthology.org/faq/copyright/',
  stats: { cer: { name: 'Character error rate', unit: '%', better: 'lower' }, bwer: { name: 'Biasing word error rate', unit: '%', better: 'lower', note: 'Rare word errors divided by total rare words, including rare-word insertions.' } },
  async fetch() {
    const p = await pdfText(feed);
    if (!p.includes('Table 5: Evaluation results on ASR and CASR tasks')) throw new Error('M3AV Table 5 missing');
    return checked([
      { model: 'AED', score: 10.0, metrics: { cer: 4.5, bwer: 35.6 } },
      { model: 'RNN-T', score: 10.6, metrics: { cer: 4.7, bwer: 38.0 } },
      { model: 'Whisper-v3 1.5B', score: 7.2, metrics: { cer: 3.8, bwer: 18.9 } },
      { model: 'Wav2Vec2+CTC 0.3B', score: 28.5, metrics: { cer: 10.6, bwer: 62.4 } },
      { model: 'Conformer+Trans. 0.6B', score: 10.5, metrics: { cer: 4.6, bwer: 38.2 } },
      { model: 'Conformer+CTC 0.6B', score: 11.1, metrics: { cer: 4.3, bwer: 42.2 } },
      { model: 'SeamlessM4T-v2 2.3B', score: 18.6, metrics: { cer: 12.4, bwer: 40.7 } },
    ], 7);
  },
};
export default board;
