// MobileMiniWoB++ measures agent task success in an Android emulator. The paper reports success rates by agent and input.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2405.14573';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'mobileminiwob', static: 'paper',
  url: 'https://arxiv.org/abs/2405.14573',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"Gemma 2": "gemma-2-27b"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[0]?.[0] === "Agent" && t[0]?.[1] === "Input" && t[0]?.[2] === "Base model" && t[0]?.[4] === "SR MobileMiniWoB++");
    if (!table) throw new Error("Missing mobileminiwob results table");
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      if (cells[0] === 'Human') continue;
      const model = cells[2];
      const score = number(cells[4]);
      rows.push({ model, score, setting: cells[1], harness: cells[0].split(' (')[0] });
    }
    if (rows.length < 9) throw new Error("Incomplete mobileminiwob comparison");
    return rows;
  },
};
export default board;
