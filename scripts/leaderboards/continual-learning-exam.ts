// Continual Learning Exam. haoyu-zhao.github.io/CLE/leaderboard draws its table from data/results.js
// (`window.CLE_RESULTS = {...}`, the paper's main results table): per harness and model configuration, two
// trials, each with per-level pass rates, completion (completed levels over all 600, 0 to 100), tokens, time
// and cost. The page opens on Trial 2 (diagnostic feedback, up to two submissions per level) sorted by
// completion, so Trial 2 completion is the score. The harness is passed on, and cost per task is the trial's
// total cost over the 120 tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = 'https://haoyu-zhao.github.io/CLE/data/results.js';

interface Data {
  denominators?: { tasks?: number };
  rows: { harness: string; model: string; t2?: { completion?: number; cost_USD?: number } }[];
}

const board: Leaderboard = {
  benchmark: 'continual-learning-exam',
  url: 'https://haoyu-zhao.github.io/CLE/leaderboard/index.html',
  feed: `${FEED} (rows[].t2.completion)`,
  terms: 'Static data script on the project GitHub Pages site; the site publishes no terms of use, so only the published numbers are read.',
  aliases: {
    Hy3: 'tencent-hy3',
  },
  async fetch() {
    const data = jsonAfter<Data>(await fetchText(FEED), 'window.CLE_RESULTS =');
    const tasks = data.denominators?.tasks || 120;
    const rows: LeaderboardRow[] = [];
    for (const r of data.rows) {
      const t = r.t2;
      if (!r.model || typeof t?.completion !== 'number') continue;
      rows.push({ model: r.model, score: Number(t.completion.toFixed(2)), harness: r.harness, cost: t.cost_USD ? t.cost_USD / tasks : undefined });
    }
    return rows;
  },
};
export default board;
