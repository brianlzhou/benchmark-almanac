// Reddit-Impacts ranks impact extraction systems by relaxed F1. The organizers publish the final test standings in Table 2 of their workshop report.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://workshop-proceedings.icwsm.org/pdf/2025_55.pdf";

const board: Leaderboard = {
  benchmark: "reddit-impacts", static: 'paper',
  url: "https://codalab.lisn.upsaclay.fr/competitions/22203",
  feed,
  terms: "The public results page gives no separate score license. CodaLab serves an HTML error page for robots.txt. The organizers publish the results in the workshop proceedings.",
  async fetch() {
    const doc = await pdfText(feed);
    const table = doc.match(/Team\s+Relaxed F1\s+Strict F1\s+Token-level F1\s+System Summary([\s\S]+?)Table 2: System summary/)?.[1] ?? '';
    const rows = [...table.matchAll(/^\s*(\S[^\n]*?)\s{2,}(0\.\d+)\s+(0\.\d+)\s+(0\.\d+)\s+([^\n]+)/gm)].map(m => {
      const description = m[5].trim().split(', ');
      const model = description[0];
      return { model, harness: m[1].trim(), setting: description.slice(1).join(', '), score: Number(m[2]), metrics: { strictF1: Number(m[3]), tokenLevelF1: Number(m[4]) } };
    });
    if (rows.length < 3) throw new Error('Missing Reddit-Impacts test scores');
    return rows;
  },
};

export default board;
