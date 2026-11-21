// FATE-X tests formal Lean proofs on 100 advanced algebra problems. Table 1 reports pass@64 with a 64k token limit.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2511.02872';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'fate-x', static: 'paper',
  url: 'https://arxiv.org/abs/2511.02872',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[0]?.[0] === "Model" && t[0]?.[1] === "FATE-M" && t[0]?.[2] === "FATE-H" && t[0]?.[3] === "FATE-X");
    if (!table) throw new Error("Missing fate-x results table");
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      if (cells.every(c => c === cells[0])) continue;
      const model = cells[0];
      const score = number(cells[3]);
      rows.push({ model, score, trials: 64, setting: 'pass@64, max 64k tokens' });
    }
    if (rows.length < 8) throw new Error("Incomplete fate-x comparison");
    return rows;
  },
};
export default board;
