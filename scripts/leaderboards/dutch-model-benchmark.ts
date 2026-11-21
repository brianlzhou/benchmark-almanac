// Dutch Model Benchmark tests Dutch language models on nine balanced NLP tasks.
// The headline is the authors' average Relative Error Reduction, reported in percent.
// This importer reads Table 2 of the benchmark paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://aclanthology.org/2023.emnlp-main.447.pdf';
const tasks = ['pos', 'ner', 'wsd', 'pr', 'cr', 'nli', 'sa', 'ald', 'qa'];
const board: Leaderboard = {
  benchmark: 'dutch-model-benchmark', static: 'paper', url: 'https://aclanthology.org/2023.emnlp-main.447/', feed: FEED,
  terms: 'ACL Anthology terms. https://aclanthology.org/faq/copyright/',
  async fetch() {
    const text = await pdfText(FEED);
    const section = text.split('Model               RER')[1]?.split('Table 2:')[0];
    if (!section) throw new Error('Dutch Model Benchmark Table 2 missing');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      const m = line.match(/^\s*(\S+)\s+((?:-?\d+(?:\.\d+)?\s+){18}-?\d+(?:\.\d+)?)\s*$/);
      if (!m) continue;
      const values = m[2].trim().split(/\s+/).map(Number);
      if (values.length !== 19) continue;
      const metrics = Object.fromEntries(tasks.map((task, i) => [task, values[2 + i * 2]]));
      rows.push({ model: m[1], score: values[0], metrics });
    }
    return checked(rows, 14);
  },
};
export default board;
