// SB10k is a German tweet sentiment benchmark. The paper's Table 2 reports macro F1 for SVM and CNN runs across three test corpora.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://aclanthology.org/W17-1106.pdf';
const board: Leaderboard = {
  benchmark: 'sb10k', static: 'paper', url: 'https://aclanthology.org/W17-1106/', feed: FEED,
  terms: 'ACL Anthology papers are available under their stated publication terms. https://aclanthology.org/W17-1106/',
  parts: { testCorpus: { name: 'Test corpus', group: 'Evaluation setting' } },
  async fetch() {
    const paper = await pdfText(FEED);
    const section = paper.split(/Classifier\s+Training Corpus\s+Test Corpus\s+F1pos\s+F1neg\s+F1neutral\s+F1/)[1]?.split(/Table 2:/)[0];
    if (!section) throw new Error('Table 2 header missing');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split(/\r?\n/)) {
      const m = line.trim().match(/^(SVM|CNN)\s+(SB10k|MGS)\s+(SB10k|MGS|DAI \(full\))\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/);
      if (!m) continue;
      rows.push({ model: m[1], setting: `Train ${m[2]}`, harness: m[3], score: Number(m[7]), metrics: { F1pos: Number(m[4]), F1neg: Number(m[5]), F1neutral: Number(m[6]) } });
    }
    if (rows.length !== 12) throw new Error(`Expected 12 Table 2 rows, found ${rows.length}`);
    return rows;
  },
};
export default board;
