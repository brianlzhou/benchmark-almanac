// METR Capability Index places models on a common ability scale fitted to TH1.1, TH2 and MirrorCode results.
// The headline score is METR's MCI estimate, with the published 95% interval.
// This importer reads the model table in the JSON linked from the November 2026 report.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://metr.org/blog/2026-11-20-q4-2026-capability-update/';
const FEED = 'https://metr.org/assets/images/q4-2026-capability-update/e401db69f8d499a7.json';
interface Entry { model?: string; released?: string; mci?: number; mci_low_95?: number; mci_high_95?: number; mci_low_80?: number; mci_high_80?: number }
interface Data { panels?: { tables?: { name?: string; rows?: Entry[] }[] }[] }

const board: Leaderboard = {
  benchmark: 'metr-capability-index',
  url: PAGE,
  feed: `${FEED} (models table)`,
  terms: 'METR links this figure data from its public report. Results are credited to METR.',
  async fetch() {
    const data = await fetchJson<Data>(FEED);
    const rows = data.panels?.flatMap((panel) => panel.tables?.find((table) => table.name === 'models')?.rows ?? []) ?? [];
    if (rows.length !== 30) throw new Error(`METR Capability Index: ${rows.length} rows, expected 30`);
    return rows.map((entry) => {
      if (!entry.model || !entry.released || typeof entry.mci !== 'number' || typeof entry.mci_low_95 !== 'number' || typeof entry.mci_high_95 !== 'number') throw new Error('METR Capability Index: incomplete row');
      return { model: entry.model, score: entry.mci, low: entry.mci_low_95, high: entry.mci_high_95, date: entry.released, metrics: { low80: entry.mci_low_80!, high80: entry.mci_high_80! } };
    });
  },
};

export default board;
