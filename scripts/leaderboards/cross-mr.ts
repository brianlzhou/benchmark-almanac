// CroSS-MR evaluates character profiling and motivation recognition from full novels.
// This importer reads the named model rows and motivation-recognition accuracy in Table 2.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://aclanthology.org/2024.emnlp-main.456.pdf';
const rows: LeaderboardRow[] = [
  ['Mistral-7B-Instruct-v0.2','Incremental Updating',48.31,2.68], ['Mixtral-8x7B-MoE','Incremental Updating',52.13,2.91], ['vicuna-7b-v1.5-16k','Incremental Updating',42.70,2.20], ['vicuna-13b-v1.5-16k','Incremental Updating',46.29,2.58], ['Qwen1.5-7B-Chat','Incremental Updating',44.49,2.42], ['Qwen1.5-14B-Chat','Incremental Updating',47.42,2.43], ['Qwen1.5-72B-Chat','Incremental Updating',52.36,3.14], ['GPT-3.5-Turbo','Incremental Updating',49.44,2.99], ['GPT-4-Turbo','Incremental Updating',57.75,3.60], ['Mistral-7B-Instruct-v0.2','Hierarchical Merging',50.56,2.77], ['Mixtral-8x7B-MoE','Hierarchical Merging',48.09,2.93], ['vicuna-7b-v1.5-16k','Hierarchical Merging',44.94,2.16], ['vicuna-13b-v1.5-16k','Hierarchical Merging',45.39,2.46], ['Qwen1.5-7B-Chat','Hierarchical Merging',44.04,2.78], ['Qwen1.5-14B-Chat','Hierarchical Merging',47.42,3.06], ['Qwen1.5-72B-Chat','Hierarchical Merging',54.61,3.46], ['GPT-3.5-Turbo','Hierarchical Merging',51.69,3.06], ['GPT-4-Turbo','Hierarchical Merging',53.71,3.72],
].map(([model, setting, score, avg]) => ({ model: model as string, setting: setting as string, score: score as number, metrics: { averageConsistency: avg as number } }));
const board: Leaderboard = {
  benchmark: 'cross-mr', static: 'paper', url: 'https://aclanthology.org/2024.emnlp-main.456/', feed: FEED,
  terms: 'The paper is publicly available from ACL Anthology. Cite the paper and follow ACL terms.',
  stats: { averageConsistency: { name: 'Average consistency', unit: 'score', better: 'higher', note: 'Reported from 0 to 100.' } },
  parts: { attributes: 'Attributes consistency', relationships: 'Relationships consistency', events: 'Events consistency', personality: 'Personality consistency' },
  async fetch() { if (!(await pdfText(FEED)).includes('Table 2: Results of different LLMs')) throw new Error('Table 2 missing'); return checked(rows, 18); },
};
export default board;
