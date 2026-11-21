// BEAR evaluates relational knowledge in language models with balanced answer sets.
// This importer reads the overall BEAR column in Table 3 of the makers' paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://aclanthology.org/2024.findings-naacl.155.pdf';
const values: [string, number, number][] = [
  ['Llama-2-13b-hf', 66.9, 1.0], ['Mistral-7B-v0.1', 65.4, 1.1], ['gemma-7b', 63.7, 1.3], ['Llama-2-7b-hf', 62.4, 1.3], ['gemma-2b', 51.5, 1.0], ['opt-30b', 47.9, 0.5], ['opt-13b', 45.4, 0.8], ['opt-6.7b', 43.8, 1.1], ['opt-2.7b', 37.3, 0.9], ['opt-1.3b', 31.5, 0.8], ['gpt2-xl', 26.2, 0.7], ['gpt2-large', 22.2, 0.6], ['roberta-large', 21.5, 0.8], ['bert-large-cased', 19.9, 0.5], ['opt-350m', 19.6, 0.6], ['gpt2-medium', 19.0, 0.8], ['bert-base-cased', 18.4, 0.4], ['roberta-base', 16.4, 0.7], ['opt-125m', 16.4, 0.5], ['xlm-roberta-large', 14.3, 0.3], ['gpt2', 13.5, 0.8], ['xlm-roberta-base', 11.4, 0.2],
];
const board: Leaderboard = {
  benchmark: 'bear', static: 'paper', url: 'https://aclanthology.org/2024.findings-naacl.155/', feed: FEED,
  terms: 'The paper is publicly available from ACL Anthology. Cite the paper and follow ACL terms.',
  parts: { bearOneToOne: 'BEAR1:1', bearOneToN: 'BEAR1:N' },
  async fetch() {
    const body = await pdfText(FEED);
    if (!body.includes('Table 3: Models investigated in this work')) throw new Error('Table 3 missing');
    return checked(values.map(([model, score, stderr]) => ({ model, score, metrics: { stderr } })), 22);
  },
};
export default board;
