// LBPP tests Python solutions on hidden tests. The paper reports pass@1 as a fraction, converted here to percent.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2407.07565';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'lbpp', static: 'paper',
  url: 'https://arxiv.org/abs/2407.07565',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"Mixtral 8\u00d77B": "mixtral-8x7b", "Mixtral 8\u00d722B": "mixtral-8x22b", "Databricks DBRX Instr.": "dbrx", "Deepseek Coder 33B Instr.": "deepseek-coder-33b", "Command R (Refresh)": "c4ai-command-r-08-2024"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const table = tables.find(t => t[0]?.[1] === "Model Name" && t[0]?.[2] === "HumanEval" && t[0]?.[3] === "MBPP" && t[0]?.[4] === "LBPP");
    if (!table) throw new Error("Missing lbpp results table");
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const model = cells[1].replace(/\\times\s*/g, '×');
      const score = Math.round(number(cells[4]) * 10000) / 100;
      rows.push({ model, score });
    }
    if (rows.length < 28) throw new Error("Incomplete lbpp comparison");
    return rows;
  },
};
export default board;
