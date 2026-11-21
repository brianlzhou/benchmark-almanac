// CLEF JOKER ranks English-to-French name translation runs by automatic reference match on the full test set.
// Table 2 reports that percentage, human acceptance on a sample, and the share copied from the source.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://ceur-ws.org/Vol-4038/paper_220.pdf";

const board: Leaderboard = {
  benchmark: "clef-joker-2025-onomastic-wordplay-translation", static: 'paper',
  url: "https://ceur-ws.org/Vol-4038/paper_220.pdf#page=7",
  feed,
  terms: "The organizers publish Table 2 in their report under CC BY 4.0. https://ceur-ws.org/Vol-4038/paper_220.pdf CEUR-WS robots.txt permits this volume.",
  async fetch() {
    const text = await pdfText(feed);
    const table = text.match(/run ID\s+automatic\s+manual\s+identical\s*\n([\s\S]*?)\n\s*\n/)?.[1];
    if (!table) throw new Error('Missing JOKER test results');
    const rows = table.trim().split('\n').map(line => {
      const m = line.trim().match(/^(\S+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/);
      if (!m) throw new Error('Invalid JOKER result: ' + line);
      return { model: m[1], submitter: m[1].includes('_') ? m[1].split('_')[0] : undefined,
        score: +m[2], metrics: { manual: +m[3], identical: +m[4] } };
    });
    if (rows.length < 21) throw new Error('Missing JOKER submissions');
    return rows;
  },
};

export default board;
