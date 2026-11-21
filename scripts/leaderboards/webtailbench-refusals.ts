// WebTailBench Refusals measures the percentage of harmful browser tasks safely refused. Table 14 compares four models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2511.19663';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'webtailbench-refusals', static: 'paper',
  url: 'https://arxiv.org/abs/2511.19663',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"OpenAI computer-use-preview": "computer-use-preview-2025-03-11"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const table = tables.find(t => t[0]?.[0] === "Model" && t[0]?.[2] === "WebTailBench Refusals (\\uparrow)");
    if (!table) throw new Error("Missing webtailbench-refusals results table");
    const rows: LeaderboardRow[] = [];
    let group = '';
    for (const cells of table.slice(1)) {
      if (!cells[2] && cells[0] === cells[1]) { group = cells[0]; continue; }
      const model = cells[0];
      const score = number(cells[2]);
      rows.push({ model, score, setting: group });
    }
    if (rows.length < 4) throw new Error("Incomplete webtailbench-refusals comparison");
    return rows;
  },
};
export default board;
