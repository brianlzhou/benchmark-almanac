// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Table 2 reports all-query accuracy for environmental sounds and instruments at two training checkpoints.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.18652';
const sources = ['ESC-50 environmental sounds','NSynth instruments'];
export default {
  benchmark: 'amemops', feed, url: feed, static: 'paper',
  terms: 'The authors link the paper license at https://arxiv.org/abs/2610.18652',
  headline: 'The paper reports no overall score. The headline is the plain mean of all-query accuracy for environmental sounds and instruments.',
  parts: Object.fromEntries(sources.flatMap(s => [s,s+' absent',s+' updated']).map(k => [k,k])),
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.join('|') === 'model|12k|24k|absent|updated');
    if (!table) throw new Error('Missing Table 2');
    const runs = new Map<string,LeaderboardRow>();
    let source = '';
    for (const [model,early,late,absent,updated] of table.slice(2)) {
      if (sources.includes(model)) { source = model; continue; }
      if (!source) throw new Error('Unknown audio collection');
      for (const [setting,raw] of [['12k training steps',early],['24k training steps',late]]) {
        if (raw === '—') continue;
        const id = model + '|' + setting;
        const row: LeaderboardRow = runs.get(id) ?? { model, setting, trials: 3, score: 0, metrics: {} };
        row.metrics![source] = numberCell(raw);
        if (setting.startsWith('24k')) {
          row.metrics![source+' absent'] = numberCell(absent);
          row.metrics![source+' updated'] = numberCell(updated);
        }
        runs.set(id,row);
      }
    }
    const rows = [...runs.values()].filter(r => sources.every(s => s in r.metrics!));
    for (const r of rows) r.score = (r.metrics![sources[0]] + r.metrics![sources[1]]) / 2;
    return checked(rows,15);
  },
} satisfies Leaderboard;
