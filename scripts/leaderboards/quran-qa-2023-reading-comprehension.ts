// Qur’an QA 2023 ranks reading comprehension runs by partial average precision. Table 5 in the organizers’ report includes all submissions and the whole-passage baseline.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://aclanthology.org/2023.arabicnlp-1.76.pdf#page=7";
const board: Leaderboard = {
  benchmark: 'quran-qa-2023-reading-comprehension', static: 'paper',
  url: "https://aclanthology.org/2023.arabicnlp-1.76.pdf#page=7",
  feed,
  terms: "The ACL Anthology robots URL returns a missing page. The table lists individual runs. The count gives participating teams. ACL publishes the paper under CC BY 4.0. https://aclanthology.org/2023.arabicnlp-1.76/",
  async fetch() {
    const paper = await pdfText(feed);
    const section = paper.match(/Team +Run +pAP\s*\n([\s\S]+?)Table 5: MRC evaluation results/);
    if (!section) throw new Error('Missing MRC Table 5');
    const rows = [...section[1].matchAll(/ {2,}(\S+) {2,}(\S+) {2,}(0\.\d+)\s*$/gm)].map(m => ({
      model: m[1], submitter: m[1], setting: m[2], score: Number(m[3]) }));
    if (rows.length < 18) throw new Error('Missing MRC test runs');
    return rows;
  },
};
export default board;
