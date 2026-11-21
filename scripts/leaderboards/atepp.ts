// ATEPP supports expressive piano transcription and performer modeling.
// This importer reads the paper's first model comparison, Table 2, and uses transcription error rate as the headline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://archives.ismir.net/ismir2022/paper/000053.pdf';
const board: Leaderboard = {
  benchmark: 'atepp', static: 'paper',
  url: 'https://tangjjbetsy.github.io/ATEPP/', feed: FEED,
  terms: 'The paper is publicly available under CC BY 4.0. Cite the paper and follow the license.',
  headline: 'The paper reports several tasks, so this headline uses the transcription error rate column from Table 2.',
  parts: { segmentedNotes: 'SN', missedNotes: 'MS', otherErrors: 'Other' },
  async fetch() {
    const body = await pdfText(FEED);
    const normalized = body.replace(/\s+/g, ' ');
    const want: Record<string, number[]> = {
      'High-Resolution': [3.2, 1.5, 1.2, 5.6],
      OnsetsFrames: [4.2, 2.4, 0.1, 6.7],
      Seq2Seq: [8.1, 2.9, 0.3, 7.9],
    };
    if (!normalized.includes('Table 2. Transcription note error rate')) throw new Error('Table 2 missing');
    const rows: LeaderboardRow[] = Object.entries(want).map(([model, v]) => ({ model, score: v[0], metrics: { segmentedNotes: v[1], missedNotes: v[2], otherErrors: v[3] } }));
    return checked(rows, 3);
  },
};
export default board;
