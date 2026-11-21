// JOKER 2025 evaluates whether translations preserve the pun. Table 7 in the linked report ranks runs by the percentage of 50 sampled items that the translator judged successful.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://ceur-ws.org/Vol-4038/paper_219.pdf#page=16";
const columns = ["count", "success", "%"];

const board: Leaderboard = {
  benchmark: "clef-joker-2025-pun-translation", static: 'paper',
  url: "https://ceur-ws.org/Vol-4038/paper_219.pdf#page=16",
  feed: FEED,
  terms: "The authors publish the results table under CC BY 4.0. https://ceur-ws.org/Vol-4038/paper_219.pdf#page=1 CEUR-WS robots.txt permits the published volume.",
  async fetch() {
    const paper = await pdfText(FEED);
    const section = paper.split("Task 2 results in terms of the number of successful translations (manual evaluation)")[1]?.split("Table 8")[0];
    if (!section) throw new Error('Missing published results table');
    const lines = section.trim().split(/\r?\n/);
    if (!columns.every((key) => lines[0].includes(key))) throw new Error('Changed results columns');
    const rows = lines.slice(1).filter((line) => line.trim()).map((line) => {
      const cells = line.trim().split(/\s+/);
      const values = cells.splice(-columns.length).map(Number);
      const model = cells.join(' ');
      if (!model || values.length !== columns.length || !values.every(Number.isFinite)) throw new Error(`Invalid row: ${line}`);
      const metrics = Object.fromEntries(columns.map((key, index) => [key, values[index]]));
      return { model, score: metrics["%"], metrics };
    });
    if (rows.length < 48) throw new Error('Expected at least 48 scored runs');
    return rows;
  },
};
export default board;
