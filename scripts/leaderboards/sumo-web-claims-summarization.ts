// The source reports no overall score. The headline is the plain mean of the two macro-F1 task scores, computed by this importer.
// SUMO tests web-claim correctness and evidence summarization.
// Table 2 of the paper supplies the PolitiFact and Snopes claim-correctness scores for ten named systems.
import type { Leaderboard } from './types.ts';

const board: Leaderboard = {
  benchmark: 'sumo-web-claims-summarization', static: 'paper',
  url: 'https://aclanthology.org/2020.wnut-1.12/', feed: 'https://aclanthology.org/2020.wnut-1.12.pdf',
  terms: 'The ACL Anthology paper is publicly available. Source attribution and ACL Anthology terms apply.',
  headline: 'The paper reports no overall score, so this is the plain mean of the PolitiFact and Snopes macro F1 scores.',
  parts: { PolitiFact: { name: 'PolitiFact' }, Snopes: { name: 'Snopes' } },
  async fetch() {
    const data: [string, number, number][] = [
      ['LSTM', 57.89, 69.89], ['CNN', 59.39, 72.63], ['HAN', 63.44, 73.84], ['DeClarE (full)', 67.10, 70.47],
      ['SADHAN-agg', 75.69, 80.09], ['SUMO-AW2V', 70.74, 75.56], ['SUMO-AtopW2V', 71.15, 76.86],
      ['SUMO-AGlove', 72.39, 77.22], ['SUMO-AtopGlove', 72.79, 78.45], ['SUMO-AtopGlove+source-Emb', 77.69, 82.93],
    ];
    return data.map(([model, p, s]) => ({ model, score: (p + s) / 2, metrics: { PolitiFact: p, Snopes: s } }));
  },
};
export default board;
