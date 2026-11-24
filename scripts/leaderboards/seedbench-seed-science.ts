// SeedBench evaluates language models on seed breeding questions and generation tasks.
// The headline is the source's unweighted average across its 11 task types.
// The importer reads both the Performance by Task Types table (11 task types) and the
// Performance by Subcategory table (C1 to C10 plus subcategory average) in the authors' README.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/InternScience/SeedBench/main/README.md';
const TASK_KEYS = ['QA-1', 'QA-2', 'QA-3', 'QA-4', 'SUM-1', 'SUM-2', 'RC-1', 'RC-2', 'RC-3', 'RC-4', 'RC-5'] as const;
const SUB_KEYS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'] as const;

const parts: Record<string, BoardPart> = {
  ...Object.fromEntries(TASK_KEYS.map((name) => [name, { name, group: 'Task type' }])),
  ...Object.fromEntries(SUB_KEYS.map((name) => [name, { name, group: 'Subcategory' }])),
};

const board: Leaderboard = {
  benchmark: 'seedbench-seed-science',
  url: 'https://github.com/InternScience/SeedBench',
  feed: FEED,
  terms: 'The authors publish this README publicly under the repository terms. Source attribution applies.',
  parts,
  stats: {
    subcategoryAvg: { name: 'Subcategory average', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(FEED);
    const taskSec = text.split('### Performance by Task Types')[1]?.split('### Performance by Subcategory')[0];
    if (!taskSec) throw new Error('SeedBench task table missing');
    const subSec = text.split('### Performance by Subcategory')[1]?.split('\n## ')[0] ?? '';

    const bySub = new Map<string, Record<string, number>>();
    for (const line of subSec.split(/\r?\n/)) {
      const cells = line.split('|').map((x) => x.trim()).filter(Boolean);
      if (cells.length !== 12 || cells[0] === 'Model' || cells[0].startsWith('-')) continue;
      const vals = cells.slice(1).map(Number);
      if (vals.some((n) => !Number.isFinite(n))) continue;
      const key = cells[0].replace(/-671B$/i, '').toLowerCase();
      bySub.set(key, {
        ...Object.fromEntries(SUB_KEYS.map((k, i) => [k, vals[i]])),
        subcategoryAvg: vals[10],
      });
    }

    const rows: LeaderboardRow[] = [];
    for (const line of taskSec.split(/\r?\n/)) {
      const cells = line.split('|').map((x) => x.trim()).filter(Boolean);
      if (cells.length !== 13 || cells[0] === 'Model' || cells[0].startsWith('-')) continue;
      const values = cells.slice(1).map(Number);
      if (values.some((n) => !Number.isFinite(n))) continue;
      const sub = bySub.get(cells[0].toLowerCase()) ?? {};
      rows.push({
        model: cells[0],
        score: values[11],
        metrics: {
          ...Object.fromEntries(TASK_KEYS.map((k, i) => [k, values[i]])),
          ...sub,
        },
      });
    }
    if (rows.length !== 3) throw new Error(`Expected three SeedBench rows, got ${rows.length}`);
    return rows;
  },
};

export default board;
