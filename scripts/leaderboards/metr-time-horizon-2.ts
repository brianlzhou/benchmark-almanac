// METR Time Horizon 2 estimates the task duration that an agent completes with
// 50 percent reliability. This importer reads METR's linked chart JSON and uses
// the 11 TH2 verifiable model rows with their 95 percent intervals.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://metr.org/blog/2026-11-20-q4-2026-capability-update/';
const FEED = 'https://metr.org/assets/images/q4-2026-capability-update/8835b7b420aed38c.json';
interface Row { series?: string; model?: string; released?: string; frontier?: boolean; horizon_minutes?: number; horizon_minutes_low_95?: number; horizon_minutes_high_95?: number }
const board: Leaderboard = {
  benchmark: 'metr-time-horizon-2', url: PAGE, feed: FEED,
  terms: 'METR links this chart JSON from its capability update report. Results are credited to METR.',
  async fetch() {
    const data = await fetchJson<{ panels?: { tables?: { rows?: Row[] }[] }[] }>(FEED);
    const source = data.panels?.[0]?.tables?.find((table) => table.rows?.some((row) => row.series === 'TH2 (Verifiable)'))?.rows ?? [];
    const rows: LeaderboardRow[] = source.filter((row) => row.series === 'TH2 (Verifiable)').flatMap((row) => {
      if (!row.model || typeof row.horizon_minutes !== 'number') return [];
      return [{ model: row.model, setting: row.series, date: row.released, score: row.horizon_minutes, low: row.horizon_minutes_low_95, high: row.horizon_minutes_high_95 }];
    });
    if (rows.length < 10) throw new Error(`METR Time Horizon 2: ${rows.length} rows, expected at least 10`);
    return rows;
  },
};
export default board;
