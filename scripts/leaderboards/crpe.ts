// CRPE measures relation comprehension using circular multiple-choice evaluation. The paper reports overall accuracy and four component accuracies.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2402.19474';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'crpe', static: 'paper',
  url: 'https://arxiv.org/abs/2402.19474',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[0]?.[0] === "Model" && t[0]?.[1] === "Exist." && t[0]?.[2] === "Subj." && t[0]?.[3] === "Pred." && t[0]?.[4] === "Obj." && t[0]?.[5] === "Overall");
    if (!table) throw new Error("Missing crpe results table");
    const rows: LeaderboardRow[] = [];
    board.parts = {"exist": "Exist.", "subj": "Subj.", "pred": "Pred.", "obj": "Obj."};
    for (const cells of table.slice(1)) {
      const model = cells[0].replace(/\s*\[\s*\d+\s*\]|\s*\(ours\)/g, '');
      const score = number(cells[5]);
      rows.push({ model, score, metrics: { exist: number(cells[1]), subj: number(cells[2]), pred: number(cells[3]), obj: number(cells[4]) } });
    }
    if (rows.length < 3) throw new Error("Incomplete crpe comparison");
    return rows;
  },
};
export default board;
