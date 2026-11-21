// PsyCoMark ranks qualifying marker extraction systems by F1.
// Table 4 of the organizers’ paper gives the official standings on the zero-to-one scale.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://aclanthology.org/2026.semeval-1.444.pdf";

const board: Leaderboard = {
  benchmark: "psycomark-marker-extraction", static: 'paper',
  url: "https://www.codabench.org/competitions/10751/",
  feed,
  terms: "The organizers publish the final standings in the ACL Anthology. The host has no robots.txt.",
  async fetch() {
    const doc = await pdfText(feed);
    const table = doc.split('Table 4: Subtask 1: System performance')[1]?.split(/\n\s*\n\s*\n/)[0];
    if (!table || !/Team\s+F1\s+DA/.test(table)) throw new Error('Missing marker extraction standings');
    const rows = [...table.matchAll(/^ +(.+?)\s{2,}(0\.\d+)\s+[✓–]/gm)];
    if (rows.length < 16) throw new Error('Incomplete qualifying teams');
    return rows.map(([, model, score]) => ({ model: model.trim(), submitter: model.trim(), score: Number(score) }));
  },
};
export default board;
