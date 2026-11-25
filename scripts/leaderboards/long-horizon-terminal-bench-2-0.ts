// Long-Horizon Terminal-Bench 2.0: 77 tasks (the 46 originals and 31 new ones), one 3-hour trial each.
// The LHTB repository README publishes the October 2026 table, generated from assets/lhtb2_results.csv
// (one row per model and task with its reward). The README's headline is mean reward over all 77 tasks,
// with unscored cells counted as 0; the importer recomputes it from the CSV the same way (0 to 100).
// The README names no agent per row. Scores do not compare with LHTB 1.0, which used a 90-minute budget.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/zli12321/LHTB/main/assets/lhtb2_results.csv';

const board: Leaderboard = {
  benchmark: 'long-horizon-terminal-bench-2-0',
  parts: {
    original: { name: 'Original tasks', group: 'Task set' },
    newTasks: { name: 'New tasks', group: 'Task set' },
  },
  url: 'https://github.com/zli12321/LHTB#lhtb-20-results-october-2026',
  feed: FEED,
  terms: 'CSV in the zli12321/LHTB repository, licensed Apache-2.0.',
  aliases: {
    'gpt-5.6-sol': 'gpt-5-6-sol',
    'Doubao Seed 2.1 Pro': 'seed-2-1-pro',
  },
  async fetch() {
    const cells = parseCsv(await fetchText(FEED));
    const tasks = new Set(cells.map((c) => c.task));
    const origTasks = new Set(cells.filter((c) => c.task_set === 'original').map((c) => c.task));
    const newTaskSet = new Set(cells.filter((c) => c.task_set === 'new').map((c) => c.task));
    const sums = new Map<string, { all: number; orig: number; added: number }>();
    for (const c of cells) {
      const e = sums.get(c.model) ?? { all: 0, orig: 0, added: 0 };
      const r = Number(c.reward) || 0;
      e.all += r;
      if (c.task_set === 'original') e.orig += r;
      else if (c.task_set === 'new') e.added += r;
      sums.set(c.model, e);
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, s] of sums) {
      const metrics: Record<string, number> = {};
      if (origTasks.size) metrics.original = Number(((100 * s.orig) / origTasks.size).toFixed(2));
      if (newTaskSet.size) metrics.newTasks = Number(((100 * s.added) / newTaskSet.size).toFixed(2));
      rows.push({
        model,
        score: (100 * s.all) / tasks.size,
        trials: 1,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    if (tasks.size < 70) throw new Error(`only ${tasks.size} tasks in lhtb2_results.csv`);
    return rows;
  },
};
export default board;
