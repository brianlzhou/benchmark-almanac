// The Large Movie Review Dataset tests binary sentiment classification on movie reviews.
// Table 2 of the dataset paper reports accuracy on its 50,000-review IMDB dataset.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const FEED = 'https://aclanthology.org/P11-1015.pdf';
const board: Leaderboard = {
  benchmark: 'large-movie-review-dataset', static: 'paper', url: 'https://aclanthology.org/P11-1015/', feed: FEED,
  terms: 'ACL Anthology papers are available under ACL terms. https://aclanthology.org/info/license/',
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.split('Features')[1]?.split('Table 2:')[0];
    if (!table || !table.includes('Our Full')) throw new Error('Missing IMDB Table 2');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split(/\r?\n/)) {
      const m = line.trim().match(/^(.+?)\s+([0-9]+\.[0-9]+|N\/A)\s+([0-9]+\.[0-9]+|N\/A)/);
      if (!m || m[2] === 'N/A') continue;
      rows.push({ model: m[1].trim(), score: Number(m[3]) });
    }
    if (rows.length < 2) throw new Error('IMDB Table 2 rows missing');
    return rows;
  },
};
export default board;
