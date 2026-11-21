// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// GeoBenchX tests whether models solve geospatial tasks and recognize impossible requests.
// Tables 1 and 2 cover all 202 tasks. Tables 3 to 6 describe overlapping task categories and Table 7 gives token totals.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2503.18129v1';
const groups = [
  ['unsolvable', 'Unsolvable tasks', '98 tasks'], ['solvable', 'Solvable tasks', '104 tasks'],
  ['merge', 'Merge-visualize', '36 tasks'], ['process', 'Process-merge-visualize', '56 tasks'],
  ['spatial', 'Spatial operations', '53 tasks'], ['heatmaps', 'Heatmaps, contour lines', '54 tasks'],
];
const board: Leaderboard = {
  benchmark: 'geobenchx', static: 'paper', url: feed, feed,
  terms: 'The authors publish the paper under the terms at https://arxiv.org/abs/2503.18129v1.',
  headline: 'The paper reports no overall score, so this is the plain mean of full-match rates on solvable and unsolvable tasks.',
  parts: Object.fromEntries(groups.map(([key, name]) => [key, name])),
  stats: {
    runInputTokens: { name: 'Input tokens', unit: 'tokens' }, runOutputTokens: { name: 'Output tokens', unit: 'tokens' },
    ...Object.fromEntries(groups.flatMap(([key]) => [[key + 'NoMatch', { name: key + ' no match rate', unit: '%', better: 'higher' }], [key + 'PartialMatch', { name: key + ' partial match rate', unit: '%', better: 'higher' }], [key + 'LengthDifference', { name: key + ' length difference', unit: 'score', better: 'lower' }]])),
  },
  aliases: {
    'Sonnet 3.7': 'claude-3-7-sonnet', 'Sonnet 3.5': 'claude-3-5-sonnet-october-2024', 'Haiku 3.5': 'claude-3-5-haiku',
    'GPT-4o (snapshot unspecified)': 'gpt-4o-aug-2024', 'GPT-4o mini (snapshot unspecified)': 'gpt-4o-mini',
    'Gemini 2.0': 'gemini-2-0-flash-feb-2025',
  },
  async fetch() {
    const html = await paperHtml(feed);
    const figures = html.match(/<figure\b[^>]*class="ltx_table[^"]*"[^>]*>[\s\S]*?<\/figure>/g) ?? [];
    const scores = groups.map(([, , caption]) => {
      const figure = figures.find(f => f.includes(caption));
      const t = figure && paperTables(figure).map(grid)[0];
      if (!t || t[0].slice(0, 4).join('|') !== 'Model|No|Partial|Match') throw new Error('Missing task table for ' + caption);
      return new Map(t.slice(3).map(r => [r[0], r]));
    });
    const tokens = paperTables(html).map(grid).find(t => t[0].join('|') === 'Model|Input|Output');
    if (!tokens || tokens[1].slice(1).join('|') !== 'tokens (mln)|tokens (k)') throw new Error('Missing token totals');
    return checked(tokens.slice(2).map(([model, input, output]) => {
      const metrics: Record<string, number> = { runInputTokens: numberCell(input) * 1e6, runOutputTokens: numberCell(output) * 1e3 };
      groups.forEach(([key], i) => {
        const row = scores[i].get(model);
        if (!row) throw new Error('Missing model in ' + key);
        metrics[key] = Math.round(numberCell(row[3]) * 100);
        metrics[key + 'NoMatch'] = Math.round(numberCell(row[1]) * 100);
        if (row[2] !== '-') metrics[key + 'PartialMatch'] = Math.round(numberCell(row[2]) * 100);
        metrics[key + 'LengthDifference'] = numberCell(row[4]);
      });
      return { model, score: (metrics.solvable + metrics.unsolvable) / 2, metrics };
    }), 7);
  },
};
export default board;
