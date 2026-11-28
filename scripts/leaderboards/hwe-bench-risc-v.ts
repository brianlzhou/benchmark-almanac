// HWE Bench V1 ranks designs by their best estimated CoreMark iterations per second. Read the
// published V1 table because its best scores include designs missing from the repository CSV.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables, num } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
const feed = "https://hwebench.com/v1/index.html";
const board: Leaderboard = {
  benchmark: 'hwe-bench-risc-v',
  url: "https://hwebench.com/v1/index.html",
  feed,
  terms: "The site returns an HTML error page for robots.txt. The authors' repository uses Apache 2.0.",
  stats: {
    completed: { name: 'Completed runs', unit: 'count' },
    attempted: { name: 'Attempted runs', unit: 'count' },
    delta: { name: 'Change from baseline', unit: '%' },
    mean: { name: 'Mean score', unit: 'score', better: 'higher' },
    area: { name: 'Four-input lookup table area', unit: 'count', better: 'lower' },
    frequency: { name: 'Maximum frequency', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === '#|Model|Reps|Best|Δ%|Mean ± std|Area (LUT4)|Fmax (MHz)');
    if (!table) throw new Error('Missing V1 leaderboard');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const [, label, reps, best, delta, mean, area, frequency] = cells.map(c => c.text);
      if (reps === 'n/a') continue;
      const match = label.match(/_(xhigh|high|medium|max)$/), score = num(best), [done, total] = reps.split('/').map(Number);
      if (!label || score === undefined || !Number.isFinite(total)) throw new Error('Invalid V1 leaderboard row');
      const model = (match ? label.slice(0, match.index) : label).replace(/(\d)_(\d)/g, '$1.$2');
      const metrics: Record<string, number> = { completed: done, attempted: total };
      for (const [key, text] of Object.entries({ delta, mean: mean.split('±')[0], std: mean.split('±')[1], area, frequency })) {
        const value = num(text);
        if (value !== undefined) metrics[key] = value * (key === 'area' && text.endsWith('k') ? 1000 : 1);
      }
      rows.push({ model, setting: match?.[1], score, metrics });
    }
    if (rows.length < 15) throw new Error('Incomplete V1 results');
    return rows;
  },
};
export default board;
