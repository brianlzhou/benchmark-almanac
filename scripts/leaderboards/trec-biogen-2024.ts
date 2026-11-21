// TREC BioGen evaluates evidence-grounded biomedical report synthesis.
// This importer reads Databricks KARL's published comparison table and uses its TREC-Biogen column.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://www.databricks.com/karl.pdf';
const board: Leaderboard = {
  benchmark: 'trec-biogen-2024', url: 'https://trec.nist.gov/data/biogen2024.html', feed: FEED,
  terms: 'Databricks publishes the comparison in its public KARL paper. https://www.databricks.com/karl.pdf',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(FEED);
    const table = text.split('In-Distribution                       Out-of-Distribution')[1]?.split('Table 4 Main Results:')[0];
    if (!table?.includes('TREC-Biogen')) throw new Error('KARL Table 4 missing');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split(/\r?\n/)) {
      const match = line.match(/^\s*(.+?)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
      if (!match || /Model|Single Task RL|Multi Task RL/.test(line)) continue;
      const cells = line.trim().split(/\s+/);
      if (cells.length < 4) continue;
      const model = (line.match(/^\s*(GPT\s+5(?:\.2)?)/)?.[1] ?? match[1]).trim();
      const score = Number(match[3]);
      if (model && Number.isFinite(score)) rows.push({ model, score, metrics: { browseCompPlus: Number(match[2]) } });
    }
    if (rows.length < 10) throw new Error(`KARL Table 4 rows missing: ${rows.length}`);
    return rows;
  },
};
export default board;
