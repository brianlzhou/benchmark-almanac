// SWE-fficiency. swefficiency.com fills its leaderboard from assets/leaderboard.json: per system ("GPT-5
// (OpenHands)") the speedup ratio (the model's speedup over the expert patch's speedup, 1.0 = expert level)
// and the share of patches that pass the tests. The speedup ratio is the board's ranking and headline. The
// record's unit is %, so the ratio is given as a percent of the expert speedup (0.225x -> 22.5), which is
// how lab cards quote it. The agent named in brackets is the harness; the Human Expert row is skipped.
// The share of patches that pass the tests (correctness, 0 to 100) is kept as metrics.correctness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://swefficiency.com';
const FEED = 'https://swefficiency.com/assets/leaderboard.json';

interface Entry {
  system?: string;
  speedup_ratio?: number;
  correctness?: number;
}

const board: Leaderboard = {
  benchmark: 'swe-fficiency',
  url: PAGE,
  feed: `${FEED} (speedup_ratio, as a percent of expert speedup)`,
  terms: 'Static JSON on the project site (GitHub Pages, no robots.txt rules); the swefficiency repository is Apache-2.0.',
  aliases: {
    'Claude 4.5 Opus': 'claude-opus-4-5',
    'Claude 4.6 Opus': 'claude-opus-4-6',
    'Claude 4.1 Opus': 'claude-opus-4-1',
    'Claude 4.5 Sonnet': 'claude-sonnet-4-5',
    'Kimi K2-0905': 'kimi-k2-sep-2025',
  },
  async fetch() {
    const data = await fetchJson<Entry[]>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const e of data) {
      const system = e.system?.trim();
      if (!system || typeof e.speedup_ratio !== 'number' || /human/i.test(system)) continue;
      const h = system.match(/\s*\(([^)]+)\)$/);
      rows.push({
        model: h ? system.slice(0, h.index).trim() : system,
        harness: h?.[1],
        score: Number((e.speedup_ratio * 100).toFixed(2)),
        ...(typeof e.correctness === 'number' ? { metrics: { correctness: e.correctness } } : {}),
      });
    }
    return rows;
  },
};
export default board;
