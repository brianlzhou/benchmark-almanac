// The Swahili Broadcast News Test measures word error rate on 1,991 broadcast-news sentences.
// This importer reads Table 3 of the makers' paper, which compares the published ASR systems.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://www.isca-archive.org/sltu_2012/gelas12_sltu.pdf';
const board: Leaderboard = {
  benchmark: 'alffa-swahili-broadcast-news-test',
  static: 'paper',
  url: 'https://www.isca-archive.org/sltu_2012/gelas12_sltu.html',
  feed: FEED,
  terms: 'The paper is publicly available from ISCA. Cite the paper and follow ISCA terms.',
  async fetch() {
    const body = await pdfText(FEED);
    const rows: LeaderboardRow[] = [];
    const normalized = body.replace(/\s+/g, ' ');
    const re = /((?:1st Set CI Word\(65k\)|2nd Set|3rd Set|4th Set|5th Set|Baseline CD Word\(65k\)|Baseline \+ Dict variants|CD Morf\(65k \+ variants\))) All quality\s+\d+\s+(\d+(?:\.\d+)?)/g;
    for (const match of normalized.matchAll(re)) rows.push({ model: match[1], score: Number(match[2]) });
    return checked(rows, 8);
  },
};
export default board;
