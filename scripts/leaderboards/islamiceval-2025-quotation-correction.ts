// IslamicEval ranks quotation correction by Subtask 1C accuracy. Table 2 of the organizers' report gives overall, Quran and Hadith accuracy for the two final systems.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://aclanthology.org/2025.arabicnlp-sharedtasks.67.pdf";
const board: Leaderboard = {
  benchmark: "islamiceval-2025-quotation-correction", static: 'paper',
  url: "https://www.codabench.org/competitions/9824/",
  feed: FEED,
  terms: "Table 2 gives the best final run per team. ACL Anthology lists CC BY 4.0. https://aclanthology.org/2025.arabicnlp-sharedtasks.67/ The ACL Anthology robots URL returns HTML.",
  parts: { quran: 'Quran', hadith: 'Hadith' },
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.match(/Team Name +F1%[^\n]*Acc-H Rank\n([\s\S]*?)Table 2: Task 1 results/);
    if (!table) throw new Error('Missing IslamicEval Table 2');
    const rows = [];
    for (const line of table[1].trim().split('\n')) {
      const cells = line.trim().split(/\s+/);
      if (cells.at(-1) === '-') continue;
      const values = cells.splice(-12);
      const [score, quran, hadith] = values.slice(8).map(Number);
      if (![score, quran, hadith].every(Number.isFinite) || !cells.length) throw new Error('Invalid Task 1C scores');
      const model = cells.join(' ');
      rows.push({ model, submitter: model, score, metrics: { quran, hadith } });
    }
    if (rows.length < 2) throw new Error('Missing quotation correction systems');
    return rows;
  },
};
export default board;
