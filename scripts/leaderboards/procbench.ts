// ProcBench scores procedural reasoning. Table 2 reports overall prefix accuracy first and also reports sequential match.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2410.03117';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'procbench', static: 'paper',
  url: 'https://arxiv.org/abs/2410.03117',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"GPT-4o": "gpt-4o-aug-2024", "Claude-3.5-Sonnet": "claude-3-5-sonnet", "Mistral-Large": "mistral-large-2-jul-2024"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[0]?.[0] === "Model" && t[0]?.[1] === "Short" && t[0]?.[3] === "Medium" && t[0]?.[5] === "Long" && t[0]?.[7] === "Overall" && t[0]?.[8] === "Overall");
    if (!table) throw new Error("Missing procbench results table");
    const rows: LeaderboardRow[] = [];
    board.parts = {"shortPA": "Short PA", "shortSM": "Short SM", "mediumPA": "Medium PA", "mediumSM": "Medium SM", "longPA": "Long PA", "longSM": "Long SM", "overallPA": "Overall PA", "overallSM": "Overall SM"};
    for (const cells of table.slice(2)) {
      const model = cells[0];
      const score = Math.round(number(cells[7]) * 10000) / 100;
      rows.push({ model, score, metrics: { shortPA: Math.round(number(cells[1]) * 10000) / 100, shortSM: Math.round(number(cells[2]) * 10000) / 100, mediumPA: Math.round(number(cells[3]) * 10000) / 100, mediumSM: Math.round(number(cells[4]) * 10000) / 100, longPA: Math.round(number(cells[5]) * 10000) / 100, longSM: Math.round(number(cells[6]) * 10000) / 100, overallPA: Math.round(number(cells[7]) * 10000) / 100, overallSM: Math.round(number(cells[8]) * 10000) / 100 } });
    }
    if (rows.length < 7) throw new Error("Incomplete procbench comparison");
    return rows;
  },
};
export default board;
