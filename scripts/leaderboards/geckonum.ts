// GeckoNum tests text-to-image models on exact and approximate numerical reasoning.
// The source has no overall score, so the headline is the plain mean of its three task accuracies.
// This importer reads Table 2 of the benchmark paper and keeps each task and standard error.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/2406.14774';
const TASKS = ['task1', 'task2', 'task3'];

const board: Leaderboard = {
  benchmark: 'geckonum', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  headline: 'The paper reports no overall score, so this is the plain mean of its three task accuracies.',
  parts: {
    task1: { name: 'Task 1: Exact Number Generation', group: 'Task', unit: '%' },
    task2: { name: 'Task 2: Approximate Number Generation and Zero', group: 'Task', unit: '%' },
    task3: { name: 'Task 3: Conceptual Quantitative Reasoning', group: 'Task', unit: '%' },
  },
  async fetch() {
    const tables = paperTables(await paperHtml(URL)).map(grid);
    const table = tables.find((rows) => rows.some((row) => row[0] === 'DALL·E 3'));
    if (!table) throw new Error('GeckoNum Table 2 missing');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const model = cells[0];
      if (!model || model === 'Random Chance') continue;
      const values = cells.slice(1, 4).map((cell) => {
        const clean = cell.replace(/\\(?:bm|underline)\{([^{}]+)\}/g, '$1');
        const match = clean.match(/([\d.]+)\\pm\s*([\d.]+)/);
        return match ? { score: Number(match[1]), stderr: Number(match[2]) } : undefined;
      });
      if (values.length !== 3 || values.some((value) => !value || !Number.isFinite(value.score))) throw new Error(`GeckoNum invalid row: ${model}`);
      const metrics: Record<string, number> = {};
      values.forEach((value, index) => { metrics[TASKS[index]] = value!.score; metrics[`${TASKS[index]}Stderr`] = value!.stderr; });
      rows.push({ model, score: values.reduce((sum, value) => sum + value!.score, 0) / 3, metrics });
    }
    return checked(rows, 12);
  },
};

export default board;
