// Epoch Capabilities Index (ECI) on Epoch AI. An IRT composite index fitted across over 50 benchmarks.
// Reads Epoch's public eci_scores.csv with each model's ECI score, 90% confidence interval, release date, and open-weights flag.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { EPOCH_TERMS } from '../lib/boards/epoch-runs.ts';

const FEED = 'https://epoch.ai/data/eci_scores.csv';

const board: Leaderboard = {
  benchmark: 'epoch-capabilities-index',
  url: 'https://epoch.ai/eci',
  feed: FEED,
  terms: EPOCH_TERMS,
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const name = (r['Display name'] || r.Model || '').trim();
      const score = Number(r.eci);
      if (!name || !Number.isFinite(score)) continue;
      const low = Number(r.eci_ci_low);
      const high = Number(r.eci_ci_high);
      const group = (r['Accessibility group'] || '').trim();
      const access = (r['Model accessibility'] || '').trim();
      const open = group === 'Open weights' || access.startsWith('Open weights')
        ? true
        : group === 'Closed weights' || ['API access', 'Hosted access (no API)', 'Unreleased'].includes(access)
          ? false
          : undefined;
      const date = /^\d{4}-\d{2}-\d{2}$/.test(r.date ?? '') ? r.date : undefined;
      rows.push({
        model: name,
        score,
        ...(Number.isFinite(low) && Number.isFinite(high) && low <= high ? { low, high } : {}),
        ...(date ? { date } : {}),
        ...(open !== undefined ? { open } : {}),
      });
    }
    if (!rows.length) throw new Error('Epoch ECI CSV returned no rows');
    return rows;
  },
};
export default board;
