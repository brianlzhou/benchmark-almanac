// SpreadsheetBench 2. The SpreadsheetBench site's v2 tab reads data/leaderboard-v2-full.json: per system
// its scaffold, score (task accuracy, 0 to 100), subscores and date. Model runs use SWE-agent as the
// scaffold, which becomes the harness. Read through spreadsheetRows in spreadsheetbench.ts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { SSB_PAGE, SSB_TERMS, ssbFeed } from './spreadsheetbench.ts';

interface Entry {
  model: string;
  scaffold?: string;
  organization?: string;
  score?: number;
  date?: string;
  verified?: boolean;
  subscores?: Record<string, number>;
}

const board: Leaderboard = {
  benchmark: 'spreadsheetbench-2',
  url: SSB_PAGE,
  feed: ssbFeed('leaderboard-v2-full.json'),
  terms: SSB_TERMS,
  parts: {
    Template: 'Template',
    'Fin.Model': 'Financial modeling',
    Debug: 'Debug',
    Visualization: 'Visualization',
  },
  aliases: {},
  verified: 'marked Verified by SpreadsheetBench',
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = [];
    for (const e of await fetchJson<Entry[]>(ssbFeed('leaderboard-v2-full.json'))) {
      if (!e.model || typeof e.score !== 'number') continue;
      const harness = e.scaffold && e.scaffold !== e.model ? e.scaffold : undefined;
      const metrics: Record<string, number> = {};
      for (const [k, v] of Object.entries(e.subscores ?? {})) if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      rows.push({
        model: e.model.replace(/^OpenAI\s+/, '').trim(),
        score: e.score,
        harness,
        submitter: e.organization || undefined,
        date: e.date,
        verified: e.verified,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};
export default board;
