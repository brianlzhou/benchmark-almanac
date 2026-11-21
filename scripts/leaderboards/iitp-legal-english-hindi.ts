// IITP-Legal ranks translations by BLEU on the complete 5,000-sentence test.
// Read the organizers' Table 2 for all systems and Table 3 for the human evaluation of the top 20.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://aclanthology.org/2025.wmt-1.57.pdf";
const board: Leaderboard = {
  benchmark: "iitp-legal-english-hindi", static: 'paper',
  url: "https://aclanthology.org/2025.wmt-1.57.pdf#page=4",
  feed: FEED,
  terms: "ACL publishes the organizers' WMT 2025 report. Its robots URL returns HTML. The original authors retain rights to the dataset.",
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.match(/Rank +LLM System +BLEU +METEOR +TER +CHRF\+\+ +BERTScore +COMET\n([\s\S]*?)Table 2:/);
    const human = paper.match(/Rank +LLM System +Human Score%([\s\S]*?)Table 3:/);
    if (!table || !human) throw new Error('Missing IITP-Legal tables');
    const ratings = new Map([...human[1].matchAll(/^\s*\d+ +([\w.-]+) +([\d.]+)/gm)].map(m => [m[1], Number(m[2])]));
    const rows = table[1].trim().split(/\n/).map(line => {
      const [, model, ...cells] = line.trim().split(/\s+/);
      const [score, meteor, ter, chrf, bertScore, comet] = cells.map(Number);
      if (cells.length !== 6 || cells.some(v => !Number.isFinite(Number(v)))) throw new Error('Invalid IITP-Legal scores');
      const metrics: Record<string, number> = { meteor, ter, chrf, bertScore, comet };
      if (ratings.has(model)) metrics.human = ratings.get(model)!;
      return { model, score, metrics };
    });
    if (rows.length !== 37 || ratings.size !== 20) throw new Error('Missing IITP-Legal systems');
    return rows;
  },
};
export default board;
