// JOKER Task 3 ranks systems on the percentage of acceptable French translations of English names.
// Table 1 of the official report identifies systems by run ID and names the submitting team.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const feed = "https://ceur-ws.org/Vol-4283/paper304.pdf";
const board: Leaderboard = {
  benchmark: 'clef-joker-2026-onomastic-wordplay-translation', static: 'paper',
  url: "https://ceur-ws.org/Vol-4283/paper304.pdf#page=5",
  feed,
  terms: "CEUR-WS robots.txt allows this volume. The authors publish the report under CC BY 4.0.",
  aliases: { llama: "llama-3-1-8b" },

  async fetch() {
    const report = await pdfText(feed);
    const table = report.split('Top-5 results per team for Task 3: Onomastic Wordplay Translation.')[1]?.split('According to the percentage')[0];
    if (!table || !/#runs\s+Score\s+Rank\s+Refs\s+Alter\s+Copy\s+run_id/.test(table)) throw new Error('Missing JOKER Table 1');
    const rows: LeaderboardRow[] = [];
    for (const match of table.matchAll(/^\s*(\d+)\s+(\S+)\s+\d+\s+([\d.]+)\s+\d+\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\S+)\s*$/gm)) {
      const [, , submitter, score, refs, alter, copy, model] = match;
      rows.push({ model, submitter, score: Number(score), metrics: { refs: Number(refs), alter: Number(alter), copy: Number(copy) } });
    }
    if (rows.length !== 16) throw new Error('Incomplete official JOKER results');
    return rows;
  },
};
export default board;
