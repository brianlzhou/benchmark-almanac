// The Faroese grammatical correctness test asks which sentence is correct. Table 4 gives accuracy,
// its confidence interval and positional bias in the first block.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://aclanthology.org/2026.lrec-main.354.pdf";
const board: Leaderboard = {
  benchmark: 'faroese-grammatical-correctness', static: 'paper',
  stats: { positionBias: { name: 'Positional bias', unit: 'score', note: 'Bias toward the first or second answer position, where negative values favor position 1.' } },
  url: "https://aclanthology.org/2026.lrec-main.354.pdf",
  feed,
  terms: "ACL Anthology returns a missing page for robots.txt. Table 4, grammatical correctness accuracy only. The university lists the paper under CC BY. The authors supply the datasets on request. https://www.pure.fo/en/publications/of-words-and-meaning-a-grammatical-and-semantic-benchmark-for-far/",
  aliases: { 'Gemma-3-4b-it': 'gemma-3-4b', 'Llama-3.2-3b-Instruct': 'llama-3-2-3b' },
  async fetch() {
    const source = await pdfText(feed);
    const table = source.match(/Model\s+Grammatical Correctness\s+Semantic Relation\s+Antonym([\s\S]*?)Table 4: Binary classification/);
    if (!table || !table[1].includes('Pos. Bias')) throw new Error('Missing Table 4');
    const rows = [...table[1].matchAll(/^([^\s]+)[ \t]+([\d.]+)\s+±([\d.]+)\s+([+-][\d.]+)/gm)].map(m => {
      const score = Number(m[2]), margin = Number(m[3]);
      return { model: m[1], score, low: score - margin, high: score + margin, metrics: { positionBias: Number(m[4]) } };
    });
    if (rows.length < 7) throw new Error('Missing Faroese judgments');
    return rows;
  },
};
export default board;
