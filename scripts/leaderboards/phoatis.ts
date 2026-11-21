// PhoATIS tests Vietnamese intent detection and slot filling.
// The headline is test-set sentence accuracy, the exact-match rate across both tasks.
// Table 2 of the authors' paper compares JointBERT+CRF and JointIDSF in four encoder and tokenization settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://www.isca-archive.org/interspeech_2021/dao21_interspeech.pdf';
const board: Leaderboard = {
  benchmark: 'phoatis',
  static: 'paper',
  url: 'https://doi.org/10.21437/Interspeech.2021-618',
  feed: FEED,
  terms: 'The ISCA paper is publicly available for research use. Source attribution and the paper license apply.',
  stats: { intentAccuracy: { name: 'Intent accuracy', unit: '%', better: 'higher' }, slotF1: { name: 'Slot F1', unit: '%', better: 'higher' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(FEED);
    const rows: LeaderboardRow[] = [];
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/(JointBERT\+CRF|Our JointIDSF)\s+(XLM-R|PhoBERT)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)/);
      if (!m) continue;
      rows.push({
        model: m[1],
        setting: m[2] + ' encoder',
        score: Number(m[5]),
        metrics: { intentAccuracy: Number(m[3]), slotF1: Number(m[4]) },
      });
    }
    if (rows.length !== 4) throw new Error(`Expected four PhoATIS Table 2 rows, got ${rows.length}`);
    return rows;
  },
};
export default board;
