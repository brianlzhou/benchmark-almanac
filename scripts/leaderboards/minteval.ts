// MINTEval tests memory across four domains. Table 4 publishes exact-match accuracy with six memory configurations.
// For SimpleMem in Table 8 we follow the paper's definition, "averaged across all domains", using its four overall columns.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2605.18565';
const board: Leaderboard = {
  benchmark: 'minteval', feed, url: feed, static: 'paper', harnesses: 'system', reference: ['Full'],
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0]?.slice(2).join('|') === 'Full|RAG|HippoRAG|AtomMem|Mem-\\alpha|MemAgent' && t.at(-1)?.[0] === 'Overall Avg.');
    const simple = tables.find(t => t[0]?.join('|') === 'Dataset|Simple|History|Counting|Ordering|Multi-hop|Overall');
    if (!main || main.length !== 22 || simple?.length !== 5) throw Error('Missing MINTEval results');
    const parts: Record<string, string> = {};
    const read = (cell: string) => {
      if (!/^\d+(?:\.\d+)?$/.test(cell)) throw Error('Invalid exact-match accuracy');
      return Number(cell);
    };
    const rows: LeaderboardRow[] = main[0].slice(2).map((name, i) => {
      const metrics: Record<string, number> = {};
      for (const row of main.slice(1, -1)) {
        const key = row[0] + ': ' + row[1];
        metrics[key] = read(row[i + 2]);
        parts[key] = key;
      }
      return { model: 'Qwen3.6-35B-A3B', harness: name.replace('\\alpha', 'α'), score: read(main.at(-1)![i + 2]), metrics };
    });
    const metrics: Record<string, number> = {};
    let sum = 0;
    for (const row of simple.slice(1)) {
      for (let i = 1; i < row.length; i++) {
        const key = i === 6 ? row[0] : row[0] + ': ' + simple[0][i].replace('Multi-hop', 'Multihop');
        metrics[key] = read(row[i]);
        parts[key] = key;
      }
      sum += metrics[row[0]];
    }
    rows.push({ model: 'Gemini-3.1-Flash-Lite', harness: 'SimpleMem', score: sum / 4, metrics });
    board.parts = parts;
    return checked(rows, 7);
  },
};
export default board;
