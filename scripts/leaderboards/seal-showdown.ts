// Scale's Showdown report gives style-controlled Elo scores on September 20, 2025. Table 1 gives asymmetric confidence intervals and a rank that disregards overlapping intervals.
import type { Leaderboard } from "./types.ts";
import { pdfText } from "../lib/boards/pdf-text.ts";
import { SCALE_ALIASES } from "../lib/scale.ts";
const board: Leaderboard = {
  benchmark: "seal-showdown", static: 'paper',
  url: "https://scale.com/showdown",
  feed: "https://static.scale.com/uploads/654197dc94d34f66c0f5184e/SEAL_Showdown_Tech_Report.pdf",
  terms: "Scale grants access through supported browsers for internal use. https://scale.com/legal/terms The old Showdown URL redirects to Scale Labs. Scale allows the page in robots.txt. Its report host returned 403 for robots.txt.",
  aliases: SCALE_ALIASES,
  async fetch() {
    const report = await pdfText(this.feed);
    const block = report.match(/Rank\s+Model\s+Score\s+CI([\s\S]*?)Table 1: The Showdown leaderboard as of September 20, 2025/);
    if (!block) throw new Error('Showdown results table missing');
    const rows = [...block[1].matchAll(/^\s*(\d+)\s+(\S+)( \(Thinking\))?\s+([\d.]+)\s+\+([\d.]+)\/-([\d.]+)\s*$/gm)].map(([,rank,raw,thinking,v,plus,minus])=>{
      const score=Number(v);
      return {model:raw.replace(/-medium$/,''),setting:thinking?'thinking':raw.endsWith('-medium')?'medium':undefined,score,low:score-Number(minus),high:score+Number(plus),date:'2025-09-20',metrics:{intervalRank:Number(rank)}};
    });
    if(rows.length!==13) throw new Error('Incomplete Showdown snapshot');
    return rows;
  },
};
export default board;
