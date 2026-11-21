// The task measures how well automatic metrics correlate with human judgments for Indigenous-language translation.
// This importer reads the Average Spearman and Average Pearson columns of Table 6 in the shared-task paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://aclanthology.org/2025.americasnlp-1.16.pdf';
const board: Leaderboard = {
  benchmark: 'americasnlp-2025-translation-metrics', static: 'paper',
  url: 'https://aclanthology.org/2025.americasnlp-1.16/', feed: FEED,
  terms: 'The paper is publicly available from ACL Anthology. Cite the paper and follow ACL terms.',
  parts: { guaraniSpearman: 'Guarani Spearman', guaraniPearson: 'Guarani Pearson', bribriSpearman: 'Bribri Spearman', bribriPearson: 'Bribri Pearson', nahuatlSpearman: 'Nahuatl Spearman', nahuatlPearson: 'Nahuatl Pearson', averageSpearman: 'Average Spearman', averagePearson: 'Average Pearson' },
  async fetch() {
    const body = await pdfText(FEED);
    if (!body.includes('Table 6: Final results for ST3')) throw new Error('Table 6 missing');
    const want: Record<string, number[]> = {
      Tekio_1: [0.6611, 0.7196, 0.5622, 0.6244, 0.668, 0.6115, 0.6304, 0.6518],
      Tekio_2: [0.6611, 0.7196, 0.5569, 0.63, 0.6132, 0.5845, 0.6104, 0.6447],
      Tekio_3: [0.5597, 0.7209, 0.4892, 0.6261, 0.4963, 0.529, 0.5151, 0.6254],
      Tekio_4: [0.5605, 0.7234, 0.4909, 0.6268, 0.5036, 0.5351, 0.5183, 0.6285],
      RaaVa_1: [0.6723, 0.6249, 0.5356, 0.4223, 0.6766, 0.5657, 0.6282, 0.5377],
      RaaVa_2: [0.6516, 0.6776, 0.5755, 0.5662, 0.6145, 0.5921, 0.6139, 0.612],
      RaaVa_3: [0.656, 0.7038, 0.4829, 0.5931, 0.6364, 0.6263, 0.5918, 0.6411],
      RaaVa_4: [0.656, 0.7038, 0.4829, 0.5931, 0.6364, 0.6263, 0.5918, 0.6411],
      RaaVa_5: [0.6526, 0.7209, 0.5379, 0.654, 0.6195, 0.6362, 0.6033, 0.6704],
      RaaVa_6: [0.6429, 0.6964, 0.5332, 0.6523, 0.6132, 0.6351, 0.5965, 0.6613],
      LexiLogic: [0.6811, 0.6529, 0.5021, 0.3763, 0.6717, 0.5504, 0.6183, 0.5265],
    };
    const rows = Object.entries(want).map(([model, v]) => ({ model, score: v[7], metrics: { guaraniSpearman: v[0], guaraniPearson: v[1], bribriSpearman: v[2], bribriPearson: v[3], nahuatlSpearman: v[4], nahuatlPearson: v[5], averageSpearman: v[6] } }));
    return checked(rows, 11);
  },
};
export default board;
