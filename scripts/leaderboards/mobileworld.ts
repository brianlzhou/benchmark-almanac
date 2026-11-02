// MobileWorld (Tongyi Lab). The board at tongyi-mai.github.io/MobileWorld reads leaderboard.json: per
// system the success rate (0 to 100) on the GUI-only, user-interaction and MCP subsets. Every row has a
// GUI-only result but many lack the other two (the page's Overall column then counts them as zero), and
// model cards cite the GUI-only figure, so GUI-only (117 tasks) is the score. "GPT-5 + UI-Ins-7B" rows pair
// a planner model with a grounding model, which becomes the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://tongyi-mai.github.io/MobileWorld/leaderboard.json';

interface Entry {
  model: string;
  date?: string;
  gui_only?: number | null;
}

const board: Leaderboard = {
  benchmark: 'mobileworld',
  url: 'https://tongyi-mai.github.io/MobileWorld/#leaderboard',
  feed: `${FEED} (GUI-only success rate)`,
  terms: 'JSON file on the MobileWorld GitHub Pages site that the page loads; the MobileWorld repository is Apache-2.0.',
  aliases: {
    'Claude-4.5-Sonnet': 'claude-sonnet-4-5',
    'Seed-2.0-Pro': 'seed-2-0-pro',
    'Seed-1.8': 'seed-1-8',
  },
  async fetch() {
    const data = await fetchJson<{ results: Entry[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data.results) {
      if (typeof r.gui_only !== 'number') continue;
      const pair = r.model.match(/^([^()]+?)\s*\+\s*([^()]+)$/);
      rows.push({
        model: pair ? pair[1].trim() : r.model.trim(),
        score: r.gui_only,
        harness: pair ? `with ${pair[2].trim()} grounding` : undefined,
        date: r.date,
      });
    }
    return rows;
  },
};
export default board;
