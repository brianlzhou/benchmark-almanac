// ParsiNLU Mizan tests literary machine translation between Persian and English.
// The paper reports SacreBLEU for Mizan in both translation directions.
// This importer reads Table 4 of the benchmark paper. The paper gives no overall score,
// so the headline is the plain mean of the two direction scores.
import type {Leaderboard,LeaderboardRow} from './types.ts';

const URL = 'https://aclanthology.org/2021.tacl-1.68/';
const board: Leaderboard = {
  benchmark: 'parsinlu-mizan',
  static: 'paper',
  url: URL,
  feed: URL,
  terms: 'The ACL Anthology paper is publicly available for research use with attribution. https://aclanthology.org/info/license/',
  headline: 'The paper reports no overall score, so this is the plain mean of the English to Persian and Persian to English Mizan SacreBLEU scores.',
  parts: {
    engToPer: {name: 'English to Persian'},
    perToEng: {name: 'Persian to English'},
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = [];
    const add = (model: string, setting: string, engToPer: number, perToEng: number) => rows.push({
      model,
      setting,
      score: (engToPer + perToEng) / 2,
      metrics: {engToPer, perToEng},
    });
    add('mT5 (small)', 'trained on our data', 8.4, 14.6);
    add('mT5 (base)', 'trained on our data', 9.4, 14.9);
    add('mT5 (large)', 'trained on our data', 10.6, 16.4);
    add('mT5 (XL)', 'trained on our data', 11.0, 19.3);
    add('mT5 (small)', 'trained on Persian and English', 19.2, 12.1);
    add('mT5 (base)', 'trained on Persian and English', 24.1, 14.8);
    add('mT5 (large)', 'trained on Persian and English', 29.9, 18.1);
    add('mT5 (XL)', 'trained on Persian and English', 33.4, 18.2);
    return rows;
  },
};
export default board;
