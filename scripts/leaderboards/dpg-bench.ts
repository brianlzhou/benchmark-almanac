// DPG-Bench measures how well images satisfy dense prompts. The paper compares generators by Average and reports five types of visual questions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2403.05135';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'dpg-bench', static: 'paper',
  url: 'https://arxiv.org/abs/2403.05135',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[0]?.[0] === "Model" && t[0]?.[1] === "#Params" && t[0]?.[2] === "Average" && t[0]?.[3] === "Global" && t[0]?.[4] === "Entity" && t[0]?.[5] === "Attribute" && t[0]?.[6] === "Relation" && t[0]?.[7] === "Other");
    if (!table) throw new Error("Missing dpg-bench results table");
    const rows: LeaderboardRow[] = [];
    board.parts = {"global": "Global", "entity": "Entity", "attribute": "Attribute", "relation": "Relation", "other": "Other"};
    for (const cells of table.slice(1)) {
      const model = cells[0].replace('\\alpha', 'α');
      const score = number(cells[2]);
      rows.push({ model, score, ...(cells[1] === '-' ? {} : { params: number(cells[1].replace(/B$/, '')) }), metrics: { global: number(cells[3]), entity: number(cells[4]), attribute: number(cells[5]), relation: number(cells[6]), other: number(cells[7]) } });
    }
    if (rows.length < 8) throw new Error("Incomplete dpg-bench comparison");
    return rows;
  },
};
export default board;
