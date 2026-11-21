// ViMU scores video subtext understanding by the All-Avg across four tasks. The authors publish the full table on their project page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://liqiiiii.github.io/Video-Metaphorical-Understanding/#results";

const board: Leaderboard = {
  benchmark: "vimu",
  url: "https://liqiiiii.github.io/Video-Metaphorical-Understanding/#results",
  feed,
  terms: "The authors embed the scores in the HTML table. The repository uses the MIT license. https://github.com/LiQiiiii/Video-Metaphorical-Understanding/blob/main/LICENSE The feed host returns no robots.txt.",
  parts: { OE: 'OE', EG: 'EG', RM: 'RM', SV: 'SV', 'SSU-Avg': 'SSU-Avg' },
  async fetch() {
    const keys = Object.keys(board.parts!);
    const table = tables(await fetchText(feed)).map(t => t.map(r => r.map(c => c.text)))
      .find(([h]) => h && ['Model', 'All-Avg', ...keys].every(k => h.includes(k)));
    if (!table) throw new Error('Missing ViMU table');
    const [header, ...entries] = table;
    const rows: LeaderboardRow[] = [];
    let open = false;
    for (const cells of entries) {
      if (cells.length === 1) { open = cells[0].includes('Open-weight'); continue; }
      const model = cells[header.indexOf('Model')], score = num(cells[header.indexOf('All-Avg')]);
      if (!model || score === undefined) throw new Error('Missing ViMU score');
      const metrics: Record<string, number> = {};
      for (const key of keys) {
        const value = num(cells[header.indexOf(key)]);
        if (value === undefined) throw new Error('Missing ' + key);
        metrics[key] = value;
      }
      rows.push({ model, score, metrics, open });
    }
    if (rows.length < 16) throw new Error('Incomplete ViMU standings');
    return rows;
  },
};
export default board;
