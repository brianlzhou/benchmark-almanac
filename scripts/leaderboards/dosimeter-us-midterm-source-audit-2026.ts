// Dosimeter counted answers citing sources on its published list, including answers that refuted a claim.
// Its results table gives the flagged count and total trials for all ten assistants.
import type { Leaderboard } from './types.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/gurovdigital/ai-chatbots-us-midterms-2026/main/README.md";
const board: Leaderboard = {
  benchmark: "dosimeter-us-midterm-source-audit-2026",
  url: "https://dosimeteraudit.org/research/ai-chatbots-us-midterms-2026",
  feed,
  terms: "Dosimeter licenses the answers, lists, and documentation under CC BY 4.0. The site permits the study page in robots.txt. The raw file host has no robots.txt.",
  stats: { cited: { name: 'Answers with Kremlin sources', unit: 'count' } },
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0]?.join('|') === 'Assistant|Answers with Kremlin sources');
    if (!table || table.length < 8) throw new Error('Missing Dosimeter results');
    return table.slice(1).map(([model, cell]) => {
      const m = cell.match(/^(\d+) of (\d+)\b/);
      if (!model || !m || Number(m[2]) < 1) throw new Error('Invalid citation count');
      return { model, score: 100 * Number(m[1]) / Number(m[2]), trials: Number(m[2]), metrics: { cited: Number(m[1]) } };
    });
  },
};
export default board;
