// ScreenSpot-v2 tests whether a click lands inside the requested interface element.
// Table 8 of the OS-Atlas paper gives average grounding accuracy and six platform-specific scores.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2410.23218';
const platforms = ['Mobile', 'Desktop', 'Web'];
const parts = platforms.flatMap(platform => ['Text', 'Icon/Widget'].map(type => ({
  key: platform.toLowerCase() + (type === 'Text' ? 'Text' : 'IconWidget'),
  name: type, group: platform,
})));

export default {
  benchmark: 'screenspot-v2', static: 'paper',
  url: 'https://arxiv.org/abs/2410.23218',
  feed,
  terms: 'arXiv allows the HTML paper in robots.txt. The authors publish it under CC BY 4.0.',
  parts: Object.fromEntries(parts.map(({ key, name, group }) => [key, { name, group }])),
  async fetch() {
    const html = await paperHtml(feed);
    const figure = html.match(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi)
      ?.find(section => section.includes('Grounding accuracy on ScreenSpot-v2'));
    const table = flatPaperTables(figure ?? '')[0];
    if (!table) throw new Error('ScreenSpot-v2 grounding table missing');
    const [platform, type, ...runs] = grid(table);
    const expected = ['Planner', 'Models', ...parts.map(p => p.group), 'Avg.'];
    if (platform.join('|') !== expected.join('|') || type.slice(2, 8).join('|') !== parts.map(p => p.name).join('|'))
      throw new Error('ScreenSpot-v2 columns changed');
    if (runs.length < 6) throw new Error('ScreenSpot-v2 expected six model and planner combinations');
    return runs.map(([planner, model, ...scores]) => {
      if (!model || !planner || scores.length !== 7) throw new Error('Incomplete ScreenSpot-v2 row');
      return {
        model, score: numberCell(scores[6]),
        ...(planner !== '-' ? { harness: planner + ' planner', models: [model, planner] } : {}),
        metrics: Object.fromEntries(parts.map((part, i) => [part.key, numberCell(scores[i])])),
      };
    });
  },
} satisfies Leaderboard;
