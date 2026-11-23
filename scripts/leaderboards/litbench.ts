// LitBench evaluates creative-writing judges against paired preference labels.
// Table 3 (appendix A.2) reports each zero-shot judge's accuracy on the held-out test set.
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
    // The published paper moved the raw results to Table 3 in appendix A.2, which sits in the left column of a
    // two-column page, so each row ends in text from the right column.
    const caption = 'Table 3: LLM-as-a-judge evaluation results by model';
    const before = paper.split(caption)[0];
    const section = before === paper ? undefined : before.slice(before.lastIndexOf('Avg. Expl. Len.'));
    if (!section) throw new Error('Missing LitBench Table 3');
    const rows: LeaderboardRow[] = [];
    for (const model of expected) {
      const match = section.match(new RegExp('(?:^|\\n)\\s*' + model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+(0?\\.\\d+)\\s+(\\d+(?:\\.\\d+)?)(?=\\s|$)'));
      if (!match) throw new Error('Missing LitBench row: ' + model);
      rows.push({ model, score: Number(match[1]) * 100, metrics: { averageExplanationLength: Number(match[2]) } });
    }
    return checked(rows, expected.length);
  },
};

export default board;
