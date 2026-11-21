// HARP-Bench tests how robots manipulate objects around active people.
// The project page reports collision-free task success, averaged equally across 37 tasks.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://harp-bench.vercel.app/';
const board: Leaderboard = {
  benchmark: 'harp-bench', url: feed, feed,
  terms: 'Public author results at https://harp-bench.vercel.app/. The page lists no separate license for the tables.',
  stats: { collision: { name: 'Collision rate', unit: '%', better: 'lower' }, within10cm: { name: 'Time within 10 cm', unit: '%', better: 'lower' }, timeWithin10cm: { name: 'Time below 10 cm', unit: '%', better: 'lower' }, minDistanceCm: { name: 'Minimum distance', unit: 'count', better: 'higher', note: 'Mean minimum distance in centimeters.' } },
  async fetch() {
    const data = tables((await fetchText(feed)).replaceAll('&pi;<sub>0</sub>', 'π0')).map(t => t.map(r => r.map(c => c.text)));
    const byTask = data.find(t => t[0][0] === 'Task');
    const safety = data.find(t => t[0][0] === 'Policy');
    if (!byTask || byTask[0].join('|') !== 'Task|Expert full state|Expert no intent|ACT|DP|π0|SmolVLA' ||
        !safety || !safety[0].join('|').includes('Collision ↓ % episodes|Within 10 cm ↓ % episodes|Time < 10 cm ↓ % of episode|Min. distance ↑ cm, mean')) throw new Error('Missing HARP result columns');
    const overall = byTask.find(row => row[0] === 'All tasks (37)');
    if (!overall) throw new Error('Missing all-task average');
    const parts: NonNullable<Leaderboard['parts']> = {};
    const rows = byTask[0].slice(3).map((model, i) => {
      const column = i + 3;
      const metrics: Record<string, number> = {};
      let group = '';
      for (const row of byTask.slice(1)) {
        if (row.length === 1) { group = row[0].replace(/ \(\d+\)$/, ''); continue; }
        if (row === overall) continue;
        const isCategory = row[0] === 'Average';
        const name = isCategory ? group : row[0];
        const key = (isCategory ? 'category_' : 'task_' + group.toLowerCase().replace(/[^a-z]/g, '_') + '_') + name.toLowerCase().replace(/\W+/g, '_');
        parts[key] = { name, group: isCategory ? 'Category' : group };
        metrics[key] = numberCell(row[column]);
      }
      if (Object.keys(metrics).length !== 41) throw new Error('Expected 37 tasks and four categories');
      const s = safety.find(row => row[0] === model);
      if (s?.length !== 6) throw new Error('Missing safety results for ' + model);
      ['collision', 'within10cm', 'timeWithin10cm', 'minDistanceCm'].forEach((key, j) => { metrics[key] = numberCell(s[j + 2]); });
      return { model, score: numberCell(overall[column]), metrics };
    });
    board.parts = parts;
    return checked(rows, 4);
  },
};
export default board;
