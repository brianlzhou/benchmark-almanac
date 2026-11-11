// Image-prompt pool. Kept separate from text-prompt votes.
// VoxelBench. voxelbench.ai/leaderboard is a Next.js page that loads its table from the site's own JSON
// endpoint, /api/leaderboard?limit=100&type=image (the default "Text" tab; an "Image" tab uses type=image).
// Each row has the model name with its reasoning effort in parentheses, a Glicko-style rating from pairwise
// human votes, its deviation and the vote counts. The rating is the score. Only models with at least 50
// votes appear, as the page says.
// The page prints the rating ± its deviation and computes the 95% interval as rating ± 1.96 × deviation,
// kept the same way as metrics.ciLow and ciHigh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://voxelbench.ai/leaderboard';
const FEED = 'https://voxelbench.ai/api/leaderboard?limit=100&type=image';

interface Row {
  modelName: string;
  modelSlug?: string;
  rating: number;
  deviation?: number;
  gamesPlayed?: number; wins?: number; losses?: number; ties?: number;
  winRate?: string | number; inputCost?: number; outputCost?: number;
}

const board: Leaderboard = {
  benchmark: 'voxelbench-image',
  url: PAGE,
  feed: `${FEED} (rating)`,
  terms: 'Public JSON endpoint the leaderboard page itself calls; voxelbench.ai serves no robots.txt and publishes no terms (its AI-visitor note covers voting only).',
  aliases: {
    'DeepSeek V4 Flash (July 2026)': 'deepseek-v4-flash-0731',
  },
  async fetch() {
    const data = await fetchJson<{ leaderboard: Row[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data.leaderboard ?? []) {
      if (!r.modelName || !Number.isFinite(r.rating)) continue;
      // "(Max)", "(xHigh)", "(32K Thinking)" are reasoning settings; "(July 2026)" is part of the name
      const m = r.modelName.match(/^(.*?)\s*\(([^)]*(?:max|high|medium|low|minimal|thinking)[^)]*)\)$/i);
      const ci = Number.isFinite(r.deviation) ? 1.96 * r.deviation! : undefined;
      const metrics: Record<string, number> = ci !== undefined ? { ciLow: Math.round(r.rating - ci), ciHigh: Math.round(r.rating + ci) } : {};
      for (const k of ['gamesPlayed', 'wins', 'losses', 'ties'] as const) if (Number.isFinite(r[k])) metrics[k] = r[k]!;
      if (r.winRate != null && Number.isFinite(Number(r.winRate))) metrics.winRate = Number(r.winRate);
      // API token prices are not measured cost per build.
      if (Number.isFinite(r.inputCost)) metrics.inputPricePerMillionTokens = r.inputCost!;
      if (Number.isFinite(r.outputCost)) metrics.outputPricePerMillionTokens = r.outputCost!;
      rows.push({
        model: m ? m[1] : r.modelName,
        setting: m ? m[2].toLowerCase() : undefined,
        score: r.rating,
        metrics,
      });
    }
    if (rows.length < 1) throw new Error(`only ${rows.length} VoxelBench rows`);
    return rows;
  },
};
export default board;
