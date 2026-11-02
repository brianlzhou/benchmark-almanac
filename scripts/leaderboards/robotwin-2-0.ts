// RoboTwin 2.0. The leaderboard page loads data/robotwin_leaderboard.json, which names its own default
// ranking: "avg" = (easy_mean + hard_mean) / 2, the mean success over the 50 tasks under clean demos
// (clean2clean) and randomized scenes (clean2random), 0 to 100. That mean is the score. Each entry is a
// robot policy with its training setting ("cotrain" or "sft", kept as the setting) and the date it was
// listed ("26.08.10", passed on as the date). Most policies have no record in data/models.json.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://robotwin-platform.github.io/leaderboard';
const FEED = 'https://robotwin-platform.github.io/data/robotwin_leaderboard.json';

interface Data {
  board: { default_ranking: string; rankings: { id: string; value: string }[] };
  entries: { name: string; setting?: string; easy_mean?: number; hard_mean?: number; listed_at?: string }[];
}

const board: Leaderboard = {
  benchmark: 'robotwin-2-0',
  url: PAGE,
  feed: `${FEED} (default ranking avg = (easy_mean + hard_mean) / 2)`,
  terms: 'JSON file on the RoboTwin GitHub Pages site that the leaderboard page loads (no robots.txt); the page states no other terms.',
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<Data>(FEED);
    const rule = data.board.rankings.find((r) => r.id === data.board.default_ranking)?.value.replace(/\s+/g, '');
    if (rule !== '(easy_mean+hard_mean)/2') throw new Error(`the default ranking changed: ${rule}`);
    const rows: LeaderboardRow[] = [];
    for (const e of data.entries) {
      if (typeof e.easy_mean !== 'number' || typeof e.hard_mean !== 'number') continue;
      const d = e.listed_at?.match(/^(\d\d)\.(\d\d)\.(\d\d)$/);
      rows.push({
        // "π0.5" becomes "pi0.5"
        model: e.name.normalize('NFKC').replace(/π/g, 'pi'),
        score: Math.round(((e.easy_mean + e.hard_mean) / 2) * 100) / 100,
        setting: e.setting,
        date: d ? `20${d[1]}-${d[2]}-${d[3]}` : undefined,
      });
    }
    return rows;
  },
};
export default board;
