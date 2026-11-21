// MultiHop-RAG tests whether a model can answer a question using evidence across news articles.
// Table 6 reports answer accuracy with retrieved chunks and with ground-truth chunks.
// The retrieved setting tests all queries with voyage-02 and bge-reranker-large. Ground-truth accuracy excludes null queries.
// The paper identifies GPT-4 as gpt-4-1106-preview in its OpenAI reference.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2401.15391";
const header = ["Models", "Retrieved Chunk", "Ground-truth Chunk"];
const board: Leaderboard = {
  benchmark: "multihop-rag", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2401.15391." ,
  stats: { groundTruthChunkAccuracy: {name:'Ground-truth chunk accuracy',unit:'%',better:'higher'} },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[1]?.join('|') === header.join('|') && t[0]?.join('|') === 'Models|Accuracy|Accuracy');
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      const model = row[0] === 'GPT-4' ? 'gpt-4-1106-preview' : row[0];
      const score = Math.round(numberCell(row[1]) * 100);
      rows.push({ model, score, metrics: { groundTruthChunkAccuracy: Math.round(numberCell(row[2]) * 100) } });
    }
    return checked(rows, 6);
  },
};
export default board;
