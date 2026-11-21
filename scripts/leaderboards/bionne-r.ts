// BioNNE-R evaluates extraction of medical relations. The bilingual test ranks systems by macro F1.
// Table 5 of the organizers’ paper gives the bilingual, English and Russian results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://ceur-ws.org/Vol-4283/paper3.pdf";

const board: Leaderboard = {
  benchmark: "bionne-r", static: 'paper',
  url: "https://www.codabench.org/competitions/13132/",
  feed,
  terms: "The authors publish their official results under CC BY 4.0. CEUR-WS robots.txt allows this volume.",
  parts: { english: 'English', russian: 'Russian' },
  async fetch() {
    const text = await pdfText(feed);
    const body = text.match(/Team +English +Russian +Bilingual\s*\n([\s\S]*?)\n\s*\n/)?.[1];
    if (!body) throw new Error('Missing BioNNE-R results table');
    const rows: LeaderboardRow[] = [];
    for (const line of body.trim().split('\n')) {
      const cells = line.trim().split(/\s{2,}/);
      if (cells.length !== 4) throw new Error('Invalid BioNNE-R row: ' + line);
      if (cells[3] === '–') continue;
      const scores = cells.slice(1).map(Number);
      if (!scores.every(Number.isFinite)) throw new Error('Invalid BioNNE-R score');
      rows.push({ model: cells[0], submitter: cells[0], score: scores[2], metrics: { english: scores[0], russian: scores[1] } });
    }
    if (rows.length < 6) throw new Error('Missing BioNNE-R bilingual submissions');
    return rows;
  },
};

export default board;
