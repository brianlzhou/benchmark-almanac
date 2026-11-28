// ReMI tests reasoning across images. Table 2 reports overall accuracy and the accuracy for each of 13 tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2406.09175';
function number(value: string) {
  if (!/^\d+(?:\.\d+)?$/.test(value)) throw new Error('Invalid ReMI accuracy');
  return Number(value);
}

const board: Leaderboard = {
  benchmark: 'remi', static: 'paper',
  url: 'https://arxiv.org/abs/2406.09175',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"Gemini Ultra": "gemini-1-0-ultra", "Gemini Flash": "gemini-1-5-flash-may-2024"},
  parts: {
    EmojiAlgebra: 'EmojiAlgebra',
    FuncRead: 'FuncRead',
    GeomShapes: 'GeomShapes',
    GeomCost: 'GeomCost',
    Collisions: 'Collisions',
    Clocks: 'Clocks',
    Schedule: 'Schedule',
    Charts: 'Charts',
    CodeEdit: 'CodeEdit',
    Isomorphism: 'Isomorphism',
    Maps: 'Maps',
    RefCOCO: 'RefCOCO',
    IQ: 'IQ',
  },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const table = tables.find(t => t[0]?.[0] === 'Task Name' && t[0]?.[1] === 'Naive Baseline' && t[0]?.at(-1) === 'Human');
    if (!table || table.length < 15 || table[0].length < 8) throw new Error('Missing ReMI comparison');
    const scoreRow = table.find(r => r[0].includes('ReMI'));
    if (!scoreRow) throw new Error('Missing ReMI overall score');
    const models = table[0].slice(2, -1);
    const rows: LeaderboardRow[] = models.map((model, i) => ({ model, score: number(scoreRow[i+2]), metrics: {} }));
    for (const cells of table.slice(1)) {
      if (cells === scoreRow) continue;
      const name = cells[0].replace(/\\mathsf\{([^}]+)\}/g, '$1');
      rows.forEach((r, i) => { r.metrics![name] = number(cells[i+2]); });
    }
    return rows;
  },
};
export default board;
