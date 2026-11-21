// PsyCoMark ranks conspiracy detection systems by weighted F1. The organizers list qualifying teams in Table 5 of the task report.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://aclanthology.org/2026.semeval-1.444.pdf";

const board: Leaderboard = {
  benchmark: "psycomark-conspiracy-detection", static: 'paper',
  url: "https://www.codabench.org/competitions/10749/",
  feed,
  terms: "The organizers report 52 teams on CodaBench and list 28 qualifying teams in the paper. Live scores, export and reuse terms remain unverified. https://aclanthology.org/2026.semeval-1.444.pdf The feed host returns no robots.txt.",
  async fetch() {
    const source = await pdfText(feed);
    const section = source.split('Table 5: Subtask 2:')[1]?.split('A recipe for success')[0];
    if (!section) throw new Error('Missing official Subtask 2 table');
    const rows = [...section.matchAll(/^\s*([^\n]+?)\s+(0\.\d+)\s+([✓–])\s+([✓–])\s+/gm)].map(m => ({
      model: m[1].trim(), submitter: m[1].trim(), score: Number(m[2]), metrics: { trainingAugmentation: Number(m[3] === '✓'), externalFineTuning: Number(m[4] === '✓') },
    }));
    if (rows.length < 28) throw new Error('Missing qualifying teams');
    return rows;
  },
};
export default board;
