// VisionArena-Bench compares model answers to 500 visual prompts.
// Tables 7 and 8 report preference scores against two baseline models.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2412.08687';
const board: Leaderboard = {
  benchmark: 'visionarena-bench', url: feed, feed, static: 'paper',
  terms: 'The authors publish the tables on arXiv. https://arxiv.org/licenses/nonexclusive-distrib/1.0/',
  aliases: {
    'claude-3.5-sonnet-20240620': 'claude-3-5-sonnet',
    'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet',
    'reka-core-20240501': 'reka-core',
  },
  async fetch() {
    const figures = (await paperHtml(feed)).match(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi) ?? [];
    const rows = ['GPT-4-Turbo', 'claude-3-sonnet-20240229'].flatMap(baseline => {
      const figure = figures.find(value => value.includes(`VisionArena-Bench leaderboard (baseline: ${baseline})`));
      const table = paperTables(figure ?? '').map(grid).find(t => t[0].join('|') === 'Model|Score|95% CI|Token #');
      if (!table) throw new Error('Missing preference scores for ' + baseline);
      return checked(table.slice(1).map(([model, value, interval, tokens]) => {
        const offsets = /^\(([-\d.]+), ([-\d.]+)\)$/.exec(interval);
        if (!offsets) throw new Error('Unexpected confidence interval for ' + model);
        const score = numberCell(value);
        return { model, score, setting: 'Baseline: ' + baseline, tokens: numberCell(tokens),
          low: Number((score + numberCell(offsets[1])).toFixed(1)),
          high: Number((score + numberCell(offsets[2])).toFixed(1)) };
      }), 16);
    });
    return checked(rows, 32);
  },
};
export default board;
