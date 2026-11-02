// Misguided Attention. cpldcpu.github.io/MisguidedAttention draws its heatmap from data.js
// (`const allData = {...}`): per prompt and model the average_total_score (0 to 1) over its evaluations.
// The page ranks models by their average over the prompts they have a score on (script.js,
// processInitialData), shown as a percent; this importer repeats that mean and scales it to 0 to 100.
// Model keys are API ids ("gpt-4o-2024-11-20", "claude-4-sonnet-0522-thinking"); dated or renamed ones the
// resolver would misplace are aliased.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const PAGE = 'https://cpldcpu.github.io/MisguidedAttention/';
const FEED = `${PAGE}data.js`;

const board: Leaderboard = {
  benchmark: 'misguided-attention',
  url: PAGE,
  feed: `${FEED} (mean average_total_score per model)`,
  terms: 'Static data script on the project GitHub Pages site (robots.txt allows all); the MisguidedAttention repository is CC0-1.0.',
  aliases: {},
  async fetch() {
    const data = jsonAfter<Record<string, Record<string, { average_total_score?: number }>>>(await fetchText(FEED), 'const allData =');
    const sums = new Map<string, { s: number; n: number }>();
    for (const byModel of Object.values(data)) {
      for (const [model, r] of Object.entries(byModel)) {
        if (typeof r?.average_total_score !== 'number' || Number.isNaN(r.average_total_score)) continue;
        const a = sums.get(model.trim()) ?? { s: 0, n: 0 };
        a.s += r.average_total_score;
        a.n++;
        sums.set(model.trim(), a);
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, a] of sums) if (a.n) rows.push({ model, score: Number(((100 * a.s) / a.n).toFixed(1)) });
    return rows;
  },
};
export default board;
