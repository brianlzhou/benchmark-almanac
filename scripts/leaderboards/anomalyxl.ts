// AnomalyXL tests evidence-grounded reasoning about anomalies in long time series.
// Table 1 gives intersection over union for localization, the first precise task, and ten other measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2608.03391';
const keys = ['Pres','ST','Cat','Mag','Id','Ind','Loc','C+E','MMag','LAC','LL'];
export default {
  benchmark: 'anomalyxl', url: feed, feed, static: 'paper', harnesses: 'system',
  terms: 'The paper and license are at https://arxiv.org/abs/2608.03391',
  headline: 'The paper reports no overall score. The headline is localization IoU, the first measure in the precise task suite.',
  parts: Object.fromEntries(keys.map((name,i) => [name,{name,group:i < 6 ? 'AnomalyXL-MCQ' : 'AnomalyXL-Localize'}])),
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.includes('AnomalyXL-Localize'));
    if (!t || t[1][8] !== 'Loc(IoU)' || t[2][0] !== 'Samples') throw new Error('Missing AnomalyXL Table 1');
    let section = '';
    const rows: LeaderboardRow[] = [];
    for (const [group,raw,...cells] of t.slice(3)) {
      if (group) section = group.replace(' (ours)','');
      if (cells.length !== keys.length) throw new Error('Invalid AnomalyXL row');
      const match = raw.match(/^(.+?)(?: \(([^)]+)\))?$/)!;
      const metrics: Record<string,number> = {};
      for (const [i,c] of cells.entries()) if (!c.startsWith('OOM')) metrics[keys[i]] = numberCell(c);
      rows.push({ model: match[1], setting: match[2], harness: section.startsWith('TimeRLM') ? section : undefined,
        score: metrics.Loc, metrics });
    }
    return checked(rows,20);
  },
} satisfies Leaderboard;
