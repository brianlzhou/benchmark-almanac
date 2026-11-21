// SURDS evaluates spatial reasoning in driving images. Table 2 reports the mean of six task accuracies.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2411.13112';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'surds', static: 'paper',
  url: 'https://arxiv.org/abs/2411.13112',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[1]?.[0] === "Model" && t[1]?.[1] === "Yaw" && t[1]?.[2] === "Pixel" && t[1]?.[3] === "Depth" && t[1]?.[4] === "Dis" && t[1]?.[5] === "L/R" && t[1]?.[6] === "F/B" && t[1]?.[7] === "Score");
    if (!table) throw new Error("Missing surds results table");
    const rows: LeaderboardRow[] = [];
    board.parts = {"yaw": "Yaw", "pixel": "Pixel", "depth": "Depth", "dis": "Dis", "lr": "L/R", "fb": "F/B"};
    for (const cells of table.slice(2)) {
      if (cells[0] === 'Random') continue;
      const model = cells[0].replace(/\s*\[\s*\d+\s*\]/, '');
      const score = number(cells[7]);
      rows.push({ model, score, metrics: { yaw: number(cells[1]), pixel: number(cells[2]), depth: number(cells[3]), dis: number(cells[4]), lr: number(cells[5]), fb: number(cells[6]) } });
    }
    if (rows.length < 11) throw new Error("Incomplete surds comparison");
    return rows;
  },
};
export default board;
