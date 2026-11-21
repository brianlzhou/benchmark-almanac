// Poly-Guard tests guardrails against adaptive red-teaming. Table 2 reports average attack success and eleven domain columns as fractions, converted to percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2506.19054';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'poly-guard-bench', static: 'paper',
  url: 'https://arxiv.org/abs/2506.19054',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[1]?.[0] === "" && t[1]?.[1] === "Message" && t[1]?.[2] === "Comm" && t[1]?.[3] === "Stream" && t[1]?.[4] === "EU AI Act" && t[1]?.[5] === "GDPR" && t[1]?.[6] === "HR" && t[1]?.[7] === "Finance" && t[1]?.[8] === "Law" && t[1]?.[9] === "Education" && t[1]?.[10] === "Code" && t[1]?.[11] === "Cyber" && t[1]?.[12] === "Average");
    if (!table) throw new Error("Missing poly-guard-bench results table");
    const rows: LeaderboardRow[] = [];
    board.parts = {"Message": "Message", "Comm": "Comm", "Stream": "Stream", "euAiAct": "EU AI Act", "GDPR": "GDPR", "HR": "HR", "Finance": "Finance", "Law": "Law", "Education": "Education", "Code": "Code", "Cyber": "Cyber"};
    for (const cells of table.slice(2)) {
      const model = cells[0];
      const score = Math.round(number(cells[12]) * 1000) / 10;
      rows.push({ model, score, metrics: { Message: Math.round(number(cells[1]) * 1000) / 10, Comm: Math.round(number(cells[2]) * 1000) / 10, Stream: Math.round(number(cells[3]) * 1000) / 10, euAiAct: Math.round(number(cells[4]) * 1000) / 10, GDPR: Math.round(number(cells[5]) * 1000) / 10, HR: Math.round(number(cells[6]) * 1000) / 10, Finance: Math.round(number(cells[7]) * 1000) / 10, Law: Math.round(number(cells[8]) * 1000) / 10, Education: Math.round(number(cells[9]) * 1000) / 10, Code: Math.round(number(cells[10]) * 1000) / 10, Cyber: Math.round(number(cells[11]) * 1000) / 10 } });
    }
    if (rows.length < 5) throw new Error("Incomplete poly-guard-bench comparison");
    return rows;
  },
};
export default board;
