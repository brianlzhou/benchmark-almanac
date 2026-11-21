// Kompetencer tests fine-grained skill classification in Danish job postings.
// The score is weighted macro F1, reported as a fraction in the paper and converted to percent.
// This importer reads Table 4 of the benchmark paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2022.lrec-1.46.pdf';
const board: Leaderboard = {
  benchmark: 'kompetencer', static: 'paper',
  url: 'https://aclanthology.org/2022.lrec-1.46/', feed,
  terms: 'ACL Anthology papers are available under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  headline: 'The paper reports weighted macro F1 on separate English and Danish splits, so this headline uses the Danish test split.',
  parts: { enDev: 'EN dev', enTest: 'EN test', daTest: 'DA test' },
  async fetch(): Promise<LeaderboardRow[]> {
    const p = await pdfText(feed);
    if (!/BERTbase \(EN\)\s+0\.628±0\.004\s+0\.632±0\.007\s+0\.038±0\.008/.test(p)) throw new Error('Missing Kompetencer Table 4');
    const rows = [
      ['BERTbase', 'EN', 0.628, 0.632, 0.038], ['JobBERT', 'EN', 0.628, 0.644, 0.063],
      ['RemBERT', 'EN', 0.629, 0.637, 0.354], ['DaBERT', 'DA', 0.088, 0.076, 0.199],
      ['DaJobBERT', 'DA', 0.101, 0.096, 0.395], ['RemBERT', 'DA', 0.116, 0.098, 0.166],
      ['RemBERT', 'EN+DA', 0.629, 0.643, 0.472],
    ];
    return checked(rows.map(([model, setting, enDev, enTest, daTest]) => ({ model: String(model), setting: String(setting), score: Number(daTest) * 100, metrics: { enDev: Number(enDev) * 100, enTest: Number(enTest) * 100, daTest: Number(daTest) * 100 } })), 7);
  },
};
export default board;
