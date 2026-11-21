// CrossSum tests cross-lingual summarization. Table 5 of the ACL paper compares five training variants.
// The headline is the authors' average ROUGE-2. The table also gives average LaSE and significance counts.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://aclanthology.org/2023.acl-long.143/';
const feed = 'https://aclanthology.org/2023.acl-long.143.pdf';
const board: Leaderboard = {
  stats: { better: { name: 'Better translations', unit: 'count' }, worse: { name: 'Worse translations', unit: 'count' }, insignificant: { name: 'Insignificant translations', unit: 'count' } },
  benchmark: 'crosssum', static: 'paper', url, feed,
  terms: 'ACL Anthology terms apply. https://aclanthology.org/faq/copyright/',
  parts: { lase: { name: 'LaSE', unit: 'score' } },
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split('Table 5: ROUGE-2 and LaSE scores for ablation.')[0].split('R-2/LaSE   Better Worse Insignificant').at(-1);
    if (!table || !paper.includes('Table 5: ROUGE-2 and LaSE scores for ablation.') || !paper.includes('R-2/LaSE   Better Worse Insignificant')) throw Error('Missing Table 5 columns');
    const rows = Array.from(table.matchAll(/\b(m2m-[\w-]+)\s+([\d.]+)\/([\d.]+)\s+(\d+)\s+(\d+)\s+(\d+)/g),
      ([, model, score, lase, better, worse, insignificant]) => ({
        model, score: Number(score), metrics: { lase: Number(lase), better: Number(better), worse: Number(worse), insignificant: Number(insignificant) },
      }));
    return checked(rows, 5);
  },
};
export default board;
