// Cozzo's AI Receptionist Benchmark tests voice agents on five booking scripts.
// The source reports scenario accuracy only. The headline is the overall passed-call percentage, computed by this importer.
// This importer reads the publisher's public CSV.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://cozzo.io/stats/ai-receptionist-accuracy/data.csv';
const board: Leaderboard = {
  benchmark: 'cozzo-ai-receptionist-round-4', url: 'https://cozzo.io/benchmarks/ai-receptionist-scenarios', feed: FEED,
  terms: 'The CSV is published under CC BY 4.0. https://cozzo.io/stats/ai-receptionist-accuracy',
  headline: 'The headline is each vendor’s passed calls divided by scored calls across the five scripts.',
  parts: {
    S1: 'Callback number captured and read back correctly',
    S2: 'Reschedule',
    S3: 'Unknown insurance',
    S4: 'Interruption',
    S5: 'Dental emergency',
    Sat: 'Saturday hours answered after the cut-in',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const rows = parseCsv(await fetchText(FEED));
    const totals = new Map<string, { passed: number; scored: number; metrics: Record<string, number> }>();
    for (const row of rows) {
      if (row.round !== 'Round 4') continue;
      const match = row.passed_of_scored.match(/^(\d+)\/(\d+)$/);
      if (!row.vendor || !row.test_id || !match) throw new Error('Invalid Cozzo CSV row');
      const entry = totals.get(row.vendor) ?? { passed: 0, scored: 0, metrics: {} };
      const passed = Number(match[1]), scored = Number(match[2]);
      entry.passed += passed; entry.scored += scored;
      entry.metrics[row.test_id] = scored ? passed / scored * 100 : 0;
      totals.set(row.vendor, entry);
    }
    const out = [...totals.entries()].map(([model, value]) => ({ model, score: value.passed / value.scored * 100, metrics: value.metrics }));
    return checked(out, 2);
  },
};
export default board;
