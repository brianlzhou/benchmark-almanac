// JOKER 2026 ranks pun translation runs by the percentage that match an annotated pun location. Table 2 publishes up to five runs per team.
import type { Leaderboard } from "./types.ts";
import { pdfText } from "../lib/boards/pdf-text.ts";
const board: Leaderboard = {
  benchmark: "clef-joker-2026-pun-translation", static: 'paper',
  url: "https://www.codabench.org/competitions/16309/",
  feed: "https://ceur-ws.org/Vol-4283/paper303.pdf",
  terms: "The authors publish the automatic pun-location ranking in their paper under CC BY 4.0. https://ceur-ws.org/Vol-4283/paper303.pdf CEUR-WS robots.txt permits the paper.",
  async fetch() {
    const report = await pdfText(this.feed);
    const body = report.split('Top-5 results per team for Task 2 Pun Translation (pun location metric).')[1]?.split('3.1. Participants')[0];
    if (!body || !/Score\s+Rank\s+run_id/.test(body)) throw new Error('Missing JOKER test ranking');
    const rows = [...body.matchAll(/^\s*\d+\s+(\S+)\s+\d+\s+([\d.]+)\s+(\d+)\s+(\S+)\s*$/gm)].map(([,submitter,value,,model]) => ({ model, submitter, score:Number(value) }));
    if (rows.length < 24) throw new Error('Incomplete JOKER test ranking');
    return rows;
  },
};
export default board;
