// M3GIA measures cognition across six languages. Table 1 reports overall accuracy and the cognitive ability breakdown.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2406.05343';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'm3gia', static: 'paper',
  url: 'https://arxiv.org/abs/2406.05343',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"Cluade3-Sonnet": "claude-3-sonnet", "Cluade3-Haiku": "claude-3-haiku", "GPT-4o": "gpt-4o-may-2024", "GPT-4v": "gpt-4v", "Gemini-1.5-Pro": "gemini-1-5-pro-may-2024"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[0]?.[1] === "Models" && t[0]?.[3] === "Gf" && t[0]?.[7] === "Gc" && t[0]?.[8] === "Gq" && t[0]?.[9] === "Grw" && t[0]?.[10] === "Gv" && t[0]?.[11] === "Overall Acc");
    if (!table) throw new Error("Missing m3gia results table");
    const rows: LeaderboardRow[] = [];
    board.parts = {"gfI": "Gf I", "gfRG": "Gf RG", "gfRQ": "Gf RQ", "gfOverall": "Gf Overall", "gc": "Gc", "gq": "Gq", "grw": "Grw", "gv": "Gv"};
    for (const cells of table.slice(2)) {
      if (cells[0] === 'Human') continue;
      const model = cells[1];
      const score = number(cells[11]);
      rows.push({ model, score, metrics: { gfI: number(cells[3]), gfRG: number(cells[4]), gfRQ: number(cells[5]), gfOverall: number(cells[6]), gc: number(cells[7]), gq: number(cells[8]), grw: number(cells[9]), gv: number(cells[10]) } });
    }
    if (rows.length < 23) throw new Error("Incomplete m3gia comparison");
    return rows;
  },
};
export default board;
