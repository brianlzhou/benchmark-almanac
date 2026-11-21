// CIMemories tests whether assistants respect context when using personal information. The main table reports Violation@5 and completeness as percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2511.14937';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'cimemories', static: 'paper',
  url: 'https://arxiv.org/abs/2511.14937',
  feed: FEED,
  terms: PAPER_TERMS,
  stats: { completeness: { name: 'Completeness', unit: '%', better: 'higher' } },
  aliases: {"Mistal-7B Instruct v0.3": "mistral-7b-v0-3", "Claude-4 Sonnet": "claude-sonnet-4", "Llama-3.3 70B Instruct": "llama-3-3-70b", "Qwen-3 32B": "qwen3-32b"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[0]?.[0] === "Model" && t[0]?.[1] === "{\\mathsf{Violation@5}} \\downarrow" && t[0]?.[2] === "{\\mathsf{Completeness}} \\uparrow");
    if (!table) throw new Error("Missing cimemories results table");
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const model = cells[0];
      const score = number(cells[1]);
      rows.push({ model, score, trials: 5, metrics: { completeness: number(cells[2]) } });
    }
    if (rows.length < 8) throw new Error("Incomplete cimemories comparison");
    return rows;
  },
};
export default board;
