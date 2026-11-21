// ALBA tests European Portuguese language generation. Table 4 of the AMALIA report gives judge scores on a 0 to 100 scale.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://aclanthology.org/2026.propor-1.38.pdf#page=8";
const board: Leaderboard = {
  benchmark: "alba-european-portuguese", static: 'paper',
  url: "https://aclanthology.org/2026.propor-1.38.pdf#page=8",
  feed: FEED,
  terms: "Use the ALBA column of Table 4. ACL lists CC BY 4.0. https://aclanthology.org/2026.propor-1.38/ The ACL Anthology robots URL returns HTML.",
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.match(/ Model +ALBA P3B3([\s\S]*?)Table 4: Language generation results/);
    if (!table) throw new Error('Missing ALBA column in Table 4');
    const rows = [...table[1].matchAll(/^ (\S[^\n]*?)[ ]{2,}([\d.]+) +([\d.]+) +([\d.]+)(?: +|$)/gm)]
      .filter(m => !m[1].includes('  '))
      .map(m => ({ model: m[1].trim(), score: Number(m[3]), open: true }));
    if (rows.length !== 14) throw new Error('Expected 14 ALBA results, found ' + rows.length);
    return rows;
  },
};
export default board;
