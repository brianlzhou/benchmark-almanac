// IslamicEval ranks passage retrieval at ten results. The organizers give every final run in Table 4, including the best runs in Table 3.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://aclanthology.org/2025.arabicnlp-sharedtasks.67.pdf";
const board: Leaderboard = {
  benchmark: "islamiceval-2025-quran-hadith-retrieval", static: 'paper',
  url: "https://www.codabench.org/competitions/9939/",
  feed: FEED,
  terms: "Table 3 gives the best final run per team. ACL Anthology lists CC BY 4.0. https://aclanthology.org/2025.arabicnlp-sharedtasks.67/ The ACL Anthology robots URL returns HTML.",
  parts: { quran: 'Quran MAP@5', hadith: 'Hadith MAP@5' },
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.match(/Team Name +Run +MAP@10 MAP_Q@5 MAP_H@5\n([\s\S]*?)Table 4: The evaluation results/);
    if (!table) throw new Error('Missing final IslamicEval retrieval runs');
    const rows = table[1].trim().split('\n').map(line => {
      const [model, setting, a, b, c] = line.trim().split(/\s+/);
      if (!setting || ![a,b,c].every(v => v && Number.isFinite(Number(v)))) throw new Error('Incomplete retrieval run');
      return { model, setting, submitter: model, score: Number(a), metrics: { quran: Number(b), hadith: Number(c) } };
    });
    if (rows.length < 19 || new Set(rows.map(r => r.model)).size < 8) throw new Error('Missing retrieval results');
    return rows;
  },
};
export default board;
