// AIR-Bench 24.05 tests information retrieval across domains, languages and long documents.
// The paper reports QA nDCG@10 and Long-Doc Recall@10 as separate parts and no whole-benchmark score.
// This importer uses the paper's Table 6, with QA nDCG@10 as the headline and Long-Doc Recall@10 as a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2412.13102';
const board: Leaderboard = {
  benchmark: 'air-bench-retrieval-24-05', static: 'paper', url: 'https://github.com/AIR-Bench/AIR-Bench', feed: FEED,
  terms: PAPER_TERMS,
  headline: 'The paper reports no overall score, so this is the QA nDCG@10 column, which it puts before Long-Doc Recall@10.',
  parts: { qa: { name: 'QA', group: 'Task', unit: 'score' }, longDoc: { name: 'Long-Doc', group: 'Task', unit: 'score' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const table = paperTables(await paperHtml(FEED)).map(grid).find((rows) => rows[0]?.[6] === 'AIR-Bench 24.05 (English, test)');
    if (!table || table.length < 20) throw new Error('AIR-Bench Table 6 missing or incomplete');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(4)) {
      const model = cells[0];
      if (!model || /^(LLM-based|Large-size|Lexical Method|BM25$)/.test(model)) continue;
      const values = cells.slice(2).map(Number);
      if (values.length !== 8 || values.some((value) => !Number.isFinite(value))) throw new Error('Invalid AIR-Bench Table 6 row');
      const setting = model.endsWith(' (zero-shot)') ? 'zero-shot' : undefined;
      const cleanModel = model.replace(/ \(zero-shot\)$/, '');
      rows.push({ model: cleanModel, setting, score: values[4], metrics: { mtebOverall: values[0], mtebOverallRank: values[1], mtebRetrieval: values[2], mtebRetrievalRank: values[3], qaRank: values[5], longDocRecallAt10: values[6], longDocRank: values[7] } });
    }
    return checked(rows, 14);
  },
};
export default board;
