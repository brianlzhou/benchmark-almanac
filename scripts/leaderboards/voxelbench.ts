// VoxelBench. voxelbench.ai/leaderboard is a Next.js page that loads its table from the site's own JSON
// endpoint, /api/leaderboard?limit=100&type=text (the default "Text" tab; an "Image" tab uses type=image).
// Each row has the model name with its reasoning effort in parentheses, a Glicko-style rating from pairwise
// human votes, its deviation and the vote counts. The rating is the score. Only models with at least 50
// votes appear, as the page says.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://voxelbench.ai/leaderboard';
const FEED = 'https://voxelbench.ai/api/leaderboard?limit=100&type=text';

interface Row {
  modelName: string;
  modelSlug?: string;
  rating: number;
}

const board: Leaderboard = {
  benchmark: 'voxelbench',
  url: PAGE,
  feed: `${FEED} (rating)`,
  terms: 'Public JSON endpoint the leaderboard page itself calls; voxelbench.ai serves no robots.txt and publishes no terms (its AI-visitor note covers voting only).',
  aliases: {
    'GPT-6-Sol': 'gpt-6-sol',
    'GPT-6.1-Terra': 'gpt-6-1-terra',
    'GPT-6-Luna': 'gpt-6-luna',
    'GPT-5.6-Terra': 'gpt-5-6-terra',
    'GPT-5.6-Luna': 'gpt-5-6-luna',
  },
  async fetch() {
    const data = await fetchJson<{ leaderboard: Row[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data.leaderboard ?? []) {
      if (!r.modelName || !Number.isFinite(r.rating)) continue;
      const m = r.modelName.match(/^(.*?)\s*\(([^)]+)\)$/);
      rows.push({ model: m ? m[1] : r.modelName, setting: m ? m[2].toLowerCase() : undefined, score: r.rating });
    }
    if (rows.length < 20) throw new Error(`only ${rows.length} VoxelBench rows`);
    return rows;
  },
};
export default board;
