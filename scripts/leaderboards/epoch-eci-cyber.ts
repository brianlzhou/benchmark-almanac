// Cyber ECI is Epoch AI's composite capability index built from 34 cybersecurity benchmarks.
// The score is the Cyber ECI value, with the published 90% credible interval retained.
// This importer reads Epoch AI's current Cyber ECI model-score CSV.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const PAGE = 'https://epoch.ai/eci?eciPreset=cyber';
const FEED = 'https://epoch.ai/data/cyber/eci_scores.csv';
const board: Leaderboard = {
  benchmark: 'epoch-eci-cyber', url: PAGE, feed: FEED,
  terms: 'Epoch AI publishes this CSV under its public data terms. Results are credited to Epoch AI.',
  async fetch(): Promise<LeaderboardRow[]> {
    const rows = parseCsv(await fetchText(FEED));
    if (rows.length < 20) throw new Error(`Cyber ECI: ${rows.length} rows, expected at least 20`);
    return checked(rows.map((row) => {
      const score = Number(row.eci);
      if (!row.Model || !Number.isFinite(score)) throw new Error('Cyber ECI: incomplete model row');
      const access = row['Model accessibility'] ?? '';
      const open = /^Open weights/i.test(access) ? true : /^(?:API access|Limited access|Unreleased)/i.test(access) ? false : undefined;
      return { model: row.Model, score, date: row.date, low: Number(row.eci_ci_low), high: Number(row.eci_ci_high), ...(open === undefined ? {} : { open }) };
    }));
  },
};
export default board;
