// CorpusQA-1M tests questions over million-token document sets. The paper ranks models by Overall accuracy for Set2 and also reports four domain accuracies.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2601.14952';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'corpusqa-1m', static: 'paper',
  url: 'https://arxiv.org/abs/2601.14952',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[0]?.[0] === "Model" && t[0]?.[1] === "Financial-zh" && t[0]?.[2] === "Financial-en" && t[0]?.[3] === "Education-en" && t[0]?.[4] === "Real Estate-en" && t[0]?.[5] === "Overall");
    if (!table) throw new Error("Missing corpusqa-1m results table");
    const rows: LeaderboardRow[] = [];
    board.parts = {"financialZh": "Financial-zh", "financialEn": "Financial-en", "education": "Education-en", "realEstate": "Real Estate-en"};
    let million = false;
    for (const cells of table.slice(1)) {
      if (cells.every(c => c === cells[0])) { million = cells[0] === 'Set2 (1M)'; continue; }
      if (!million) continue;
      const model = cells[0];
      const score = number(cells[5]);
      rows.push({ model, score, metrics: { financialZh: number(cells[1]), financialEn: number(cells[2]), education: number(cells[3]), realEstate: number(cells[4]) } });
    }
    if (rows.length < 3) throw new Error("Incomplete corpusqa-1m comparison");
    return rows;
  },
};
export default board;
