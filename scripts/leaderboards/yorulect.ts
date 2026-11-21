// YorùLect measures speech transcription quality on Ifè, Ìlàje and Standard Yorùbá.
// The source reports no overall WER, so the headline is the plain mean of its three dialect scores.
// Table 4 in the paper supplies WER for three named speech models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const board: Leaderboard = {
  benchmark: 'yorulect',
  url: 'https://aclanthology.org/2024.emnlp-main.251/',
  feed: 'https://aclanthology.org/2024.emnlp-main.251.pdf',
  terms: 'The paper is published by the Association for Computational Linguistics. Cite the paper and follow its terms.',
  static: 'paper',
  headline: 'The paper reports no overall score, so this is the plain mean of its three WER dialect scores.',
  parts: {
    ife: { name: 'Ifè', group: 'Dialect', better: 'lower' },
    ilaje: { name: 'Ìlàje', group: 'Dialect', better: 'lower' },
    standard: { name: 'Standard', group: 'Dialect', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    return checked([
      { model: 'MMS', score: 80.5567, metrics: { ife: 85.38, ilaje: 83.79, standard: 72.50 } },
      { model: 'SeamlessM4T', score: 92.7567, metrics: { ife: 96.14, ilaje: 101.99, standard: 80.14 } },
      { model: 'Whisper', score: 120.89, metrics: { ife: 104.50, ilaje: 127.21, standard: 130.96 } },
    ]);
  },
};
export default board;
