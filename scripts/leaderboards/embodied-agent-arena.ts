// Embodied Agent Arena evaluates geometry, spatial reasoning, affordance, planning, and manipulation.
// Its model comparison CSV lists rotation error in degrees first. Lower is better. The source-level
// CSV adds spatial and affordance breakdowns. Run counts and standard deviations vary by metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const base = 'https://raw.githubusercontent.com/embodied-agent-arena/embodied-agent-arena/HEAD/public/data/';
const feed = base + 'model-comparison.csv';
const board: Leaderboard = {
  benchmark: 'embodied-agent-arena', url: 'https://embodied-agent-arena.github.io/embodied-agent-arena/#results', feed,
  aliases: {'DeepSeek 4.1 Flash-1017':'deepseek-v4-1-flash-1017'},
  terms: 'The results repository uses MIT. https://github.com/embodied-agent-arena/embodied-agent-arena/blob/HEAD/LICENSE',
  headline: 'The authors report no overall score. Their first metric is rotation error in degrees, where lower is better.',
  async fetch() {
    const main = parseCsv(await fetchText(feed));
    const rows = new Map<string, LeaderboardRow>();
    board.parts = {};
    for (const r of main) {
      const key = r.domain + ': ' + r.metric.replaceAll('–','-');
      const value = numberCell(r.value);
      const runs = numberCell(r.runs);
      if (key === 'Geometry: Rotation error') {
        if (r.unit !== 'degrees' || r.better_direction !== 'lower' || rows.has(r.model)) throw new Error('Unexpected rotation metric');
        rows.set(r.model, {model:r.model, score:value, trials:runs, metrics:{std:numberCell(r.run_sd)}, link:r.source_url});
      }
      const row = rows.get(r.model);
      if (!row || key in row.metrics!) throw new Error('Missing or duplicate model metric');
      board.parts[key] = {name:r.metric.replaceAll('–','-'),group:r.domain,unit:r.unit === '%' ? '%' : 'score',
        better:r.better_direction === 'lower' ? 'lower' : 'higher',note:'Reported unit: ' + r.unit + '.'};
      row.metrics![key] = value;
      if (r.run_sd) row.metrics![key + 'Std'] = numberCell(r.run_sd);
    }
    if (Object.keys(board.parts).length !== 8 || main.length !== rows.size * 8) throw new Error('Incomplete domain results');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const details = parseCsv(await fetchText(base + 'source-results-mean-sd.csv'));
    if (details.length !== 18 * rows.size) throw new Error('Incomplete source-level results');
    for (const r of details) {
      const row = rows.get(r.model);
      const key = r.source + ': ' + r.metric;
      if (!row || key in row.metrics!) throw new Error('Unexpected source-level score');
      const unit = r.metric.endsWith('_iou') ? 'score' : '%';
      // source-level accuracy and IoU are higher-better, unlike the rotation-error headline
      board.parts[key] = {name: r.source.replace(/^w[25]_/, '') + ': ' + r.metric.replaceAll('_',' '), group:'Source-level results', unit, better:'higher'};
      row.metrics![key] = numberCell(r.mean);
      if (r.run_sd) row.metrics![key + 'Std'] = numberCell(r.run_sd);
    }
    return checked([...rows.values()], 10);
  },
};
export default board;
