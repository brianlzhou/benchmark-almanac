// miniCTX-v2. cmu-l3.github.io/minictx/leaderboard.html fills its table from results.json: per model, the
// number of theorems passed out of the miniCTX-v2 test split (334) for each context setting, as a list by
// attempt budget. The page opens on "In-file context", "Best-of-1", ranked by passed[0] / total, so that is
// the score here (percent). The parenthesized date after each name is the model version, not the run date;
// the snapshot ones get aliases and the rest are left to the resolver without it.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://cmu-l3.github.io/minictx/leaderboard.html';
const FEED = 'https://cmu-l3.github.io/minictx/results.json';

type Setting = { passed: number[]; total: number };

const board: Leaderboard = {
  benchmark: 'minictx-v2',
  url: PAGE,
  feed: `${FEED} (in-file, best-of-1)`,
  terms: 'Static JSON on the project GitHub Pages site (no robots.txt); the page credits EvalPlus for its layout and states no other terms.',
  aliases: {
    'GPT 4o (11/20/2024)': 'gpt-4o-nov-2024',
  },
  async fetch() {
    const data = await fetchJson<Record<string, Record<string, Setting | string>>>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const [name, v] of Object.entries(data)) {
      const s = v['in-file'] as Setting | undefined;
      if (!s?.passed?.length || !s.total) continue;
      const model = name.includes('11/20/2024') ? name : name.replace(/\s*\([^)]*\)\s*$/, '');
      rows.push({ model, score: Number(((s.passed[0] / s.total) * 100).toFixed(1)) });
    }
    return rows;
  },
};
export default board;
