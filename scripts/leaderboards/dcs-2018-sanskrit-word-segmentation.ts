// DCS 2018 tests Sanskrit word segmentation.
// The headline is sentence accuracy from the paper's comparison table.
// This importer reads Table 3 of the shared-task paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://aclanthology.org/D18-1295.pdf';
const board: Leaderboard = {
  benchmark: 'dcs-2018-sanskrit-word-segmentation', static: 'paper', url: 'https://aclanthology.org/D18-1295/', feed: FEED,
  terms: 'ACL Anthology terms. https://aclanthology.org/faq/copyright/',
  async fetch() {
    const text = await pdfText(FEED);
    const section = text.split('Comparison with other models')[1]?.split('Table 3:')[0];
    if (!section) throw new Error('DCS Table 3 missing');
    const rows: LeaderboardRow[] = [];
    const pattern = /(Hellwig \(2015b\)|Reddy et al\. \(2018\)|Transformer 5K)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/g;
    for (const m of section.matchAll(pattern)) rows.push({ model: m[1], score: Number(m[5]), metrics: { precision: Number(m[2]), recall: Number(m[3]), f1: Number(m[4]) } });
    return checked(rows, 3);
  },
};
export default board;
