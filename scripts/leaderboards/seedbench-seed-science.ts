// SeedBench evaluates language models on seed breeding questions and generation tasks.
// The headline is the source's unweighted average across its 11 task types.
// The importer reads the Performance by Task Types table in the authors' README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/InternScience/SeedBench/main/README.md';
const parts = Object.fromEntries(['QA-1','QA-2','QA-3','QA-4','SUM-1','SUM-2','RC-1','RC-2','RC-3','RC-4','RC-5'].map(name => [name, { name }]));
const board: Leaderboard = {
  benchmark: 'seedbench-seed-science', url: 'https://github.com/InternScience/SeedBench', feed: FEED,
  terms: 'The authors publish this README publicly under the repository terms. Source attribution applies.', parts,
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(FEED);
    const section = text.split('### Performance by Task Types')[1]?.split('### Performance by Subcategory')[0];
    if (!section) throw new Error('SeedBench task table missing');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split(/\r?\n/)) {
      const cells = line.split('|').map(x => x.trim()).filter(Boolean);
      if (cells.length !== 13 || cells[0] === 'Model' || cells[0].startsWith('-')) continue;
      const values = cells.slice(1).map(Number);
      if (values.some(n => !Number.isFinite(n))) continue;
      rows.push({ model: cells[0], score: values[11], metrics: Object.fromEntries(['QA-1','QA-2','QA-3','QA-4','SUM-1','SUM-2','RC-1','RC-2','RC-3','RC-4','RC-5'].map((k, i) => [k, values[i]])) });
    }
    if (rows.length !== 3) throw new Error(`Expected three SeedBench rows, got ${rows.length}`);
    return rows;
  },
};
export default board;
