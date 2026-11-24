// SpatialGenEval tests spatial reasoning in generated images. Tables 2 and 10 give overall
// accuracy and ten question-type accuracies with two different vision-language judges.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2601.20354';
const board: Leaderboard = {
  benchmark: 'spatialgeneval', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results under the terms linked at https://arxiv.org/abs/2601.20354.',
  aliases: { 'Seed Dream 4.0': 'seedream-4-0', 'Nano Banana': 'gemini-2-5-flash-image-preview-nano-banana',
    'SD-3.5-L': 'stable-diffusion-3-5-large' },
  async fetch() {
    const html = await paperHtml(feed);
    const figures = [...html.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/g)].map(m => m[0]);
    const rows: LeaderboardRow[] = [];
    for (const judge of ['Qwen 2.5 VL (72B)', 'GPT-4o']) {
      const figure = figures.find(f => f.includes('SpatialGenEval leaderboard based on ' + judge));
      if (!figure) throw new Error('Missing leaderboard for ' + judge);
      const t = flatPaperTables(figure).map(grid).find(t => t[1]?.join('|') === 'Model|Size|Overall|Object|Attribute|Position|Orientation|Layout|Comparison|Proximity|Occlusion|Motion|Causal');
      if (!t) throw new Error('Missing spatial accuracy columns');
      const keys = t[1].slice(3);
      board.parts = Object.fromEntries(keys.map((name, i) => [name, { name, group: t[0][3 + i] }]));
      for (const [model, size, overall, ...scores] of t.slice(2)) {
        if (model === size || model === 'Random') continue;
        if (scores.length !== keys.length) throw new Error('Missing spatial subscores for ' + model);
        rows.push({ model, setting: judge + ' judge', score: numberCell(overall), ...(size === '-' ? {} : { params: numberCell(size.replace(/B$/, '')) }),
          metrics: Object.fromEntries(keys.map((k, i) => [k, numberCell(scores[i])])) });
      }
    }
    return checked(rows, 46);
  },
};
export default board;
