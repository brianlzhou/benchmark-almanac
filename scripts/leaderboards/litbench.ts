// LitBench evaluates creative-writing judges against paired preference labels.
// Table 1 reports each zero-shot judge's accuracy on the held-out test set.
// This importer reads the authors' table from the ACL Anthology paper PDF.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2026.eacl-long.362.pdf';
const expected = ['claude-3-5-haiku', 'claude-3-7-sonnet', 'gpt-4.1', 'gpt-4.1-mini', 'o4-mini', 'deepseek-v3', 'deepseek-r1', 'gemma-3-12b-it', 'llama-3.1-8b', 'qwen-2.5-7b'];

const board: Leaderboard = {
  benchmark: 'litbench',
  static: 'paper',
  url: 'https://aclanthology.org/2026.eacl-long.362/',
  feed,
  terms: 'ACL Anthology terms. https://aclanthology.org/faq/copyright/',
  async fetch(): Promise<LeaderboardRow[]> {
    const paper = await pdfText(feed);
    const section = paper.split('A.1 LLM-as-judge Raw Results')[1]?.split('A.2 LLM-as-judge Prompt Optimization')[0];
    if (!section) throw new Error('Missing LitBench Table 1');
    const rows: LeaderboardRow[] = [];
    for (const model of expected) {
      const match = section.match(new RegExp('(?:^|\\n)\\s*' + model.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') + '\\s+(0?\\.\\d+)\\s+([\\d.]+)\\s*(?:\\n|$)'));
      if (!match) throw new Error('Missing LitBench row: ' + model);
      rows.push({ model, score: Number(match[1]) * 100, metrics: { averageExplanationLength: Number(match[2]) } });
    }
    return checked(rows, expected.length);
  },
};

export default board;
