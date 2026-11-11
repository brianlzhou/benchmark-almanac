// MobileWorld (Tongyi Lab). The board at tongyi-mai.github.io/MobileWorld reads leaderboard.json: per
// system the success rate (0 to 100) on the GUI-only, user-interaction and MCP subsets. Every row has a
// GUI-only result but many lack the other two. Match the page's Overall column, which counts missing
// subsets as zero and weights all three subsets by their published task counts. "GPT-5 + UI-Ins-7B" rows pair
// a planner model with a grounding model, which becomes the harness. The other two subsets' success rates go in
// `metrics` when a row has them ("userInteraction" and "mcp", %).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://tongyi-mai.github.io/MobileWorld/leaderboard.json';

interface Entry {
  model: string;
  date?: string;
  max_steps?: number;
  runs?: number;
  agent_type?: string;
  gui_only?: number | null;
  user_int?: number | null;
  mcp?: number | null;
}

const board: Leaderboard = {
  benchmark: 'mobileworld',
  url: 'https://tongyi-mai.github.io/MobileWorld/#leaderboard',
  feed: `${FEED} (Overall success rate, weighted by published task counts)`,
  terms: 'JSON file on the MobileWorld GitHub Pages site that the page loads; the MobileWorld repository is Apache-2.0.',
  aliases: {
    'Claude-4.5-Sonnet': 'claude-sonnet-4-5',
    'Seed-2.0-Pro': 'seed-2-0-pro',
    'Seed-1.8': 'seed-1-8',
  },
  async fetch() {
    const data = await fetchJson<{ results: Entry[]; task_counts: Record<string,number> }>(FEED);
    const counts = ['GUI-Only', 'User-Int.', 'MCP'].map(k => data.task_counts[k]);
    if (counts.some(n => !Number.isFinite(n) || n <= 0)) throw new Error('MobileWorld task counts missing');
    const total = counts.reduce((a,b) => a+b, 0);
    const rows: LeaderboardRow[] = [];
    for (const r of data.results) {
      if (typeof r.gui_only !== 'number') continue;
      const pair = r.model.match(/^([^()]+?)\s*\+\s*([^()]+)$/);
      rows.push({
        model: pair ? pair[1].trim() : r.model.trim(),
        score: ((r.gui_only ?? 0) * counts[0] + (r.user_int ?? 0) * counts[1] + (r.mcp ?? 0) * counts[2]) / total,
        setting: [r.max_steps != null ? `max_steps=${r.max_steps}` : null, r.runs != null ? `runs=${r.runs}` : null].filter(Boolean).join("; ") || undefined,
        harness: pair ? `with ${pair[2].trim()} grounding` : r.agent_type,
        date: r.date,
              metrics: {
                guiOnly: r.gui_only,
                ...(typeof r.user_int === 'number' ? { userInteraction: r.user_int } : {}),
                ...(typeof r.mcp === 'number' ? { mcp: r.mcp } : {}),
              },
      });
    }
    return rows;
  },
};
export default board;
