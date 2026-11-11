// Epoch Automation Reports (Epoch AI). The benchmark is not in Epoch's benchmark_data.zip, so this reads its
// hub page, epoch.ai/benchmarks/epoch-automation-reports. The server-rendered heatmap "Rubric scores by
// system and task category" has one row per system (model and agent harness) and a cell per task category
// plus an Average cell; each cell's aria-label carries the value to one decimal ("Grok 4.6 (Grok Build),
// average: 59.1%"). The average, the mean rubric score across the five categories, is the score.
// Individual published task examples are excluded from benchmark scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const PAGE = 'https://epoch.ai/benchmarks/epoch-automation-reports';

const board: Leaderboard = {
  benchmark: 'epoch-automation-reports',
  url: PAGE,
  feed: `${PAGE} (server-rendered heatmap, average cells)`,
  terms: 'Server-rendered Epoch AI page (robots.txt allows /benchmarks/); Epoch publishes its benchmark data under CC BY 4.0.',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const rows: LeaderboardRow[] = [];
    for (const m of html.matchAll(/aria-label="([^"(]+?)\s*\(([^)]+)\), average: ([\d.]+)%"/g)) {
      const score = num(m[3]);
      if (score !== undefined) rows.push({ model: m[1].trim(), score, harness: m[2].trim() });
    }
    if (!rows.length) throw new Error('no average cells on the Epoch Automation Reports page');
    return rows;
  },
};
export default board;
