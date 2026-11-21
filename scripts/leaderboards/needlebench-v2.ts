// NeedleBench V2 tests retrieval and multi-step reasoning in long contexts.
// The score is the paper's Overall percentage across single retrieval, multi retrieval and multi reasoning.
// This importer reads Table 1, Main Results of NeedleBench 32K, from the paper HTML.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2407.11963v3';
const board: Leaderboard = {
  benchmark: 'needlebench-v2', static: 'paper', url: FEED, feed: FEED, terms: PAPER_TERMS,
  async fetch() {
    const tables = paperTables(await paperHtml(FEED));
    const table = grid(tables[4]);
    if (table[0]?.at(-1) !== 'Overall') throw new Error('NeedleBench V2 Overall column missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(4)) {
      const model = row[0]?.trim();
      const score = Number(row.at(-1));
      if (!model || !Number.isFinite(score) || /^Models /.test(model)) continue;
      rows.push({ model, score, metrics: { singleRetrieval: Number(row[3]), multiRetrieval: Number(row[6]), multiReasoning: Number(row[9]) } });
    }
    return checked(rows, 10);
  },
};
export default board;
