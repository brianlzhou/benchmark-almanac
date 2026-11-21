// The source reports no overall score. The headline is the plain mean of the 14 parts, computed by this importer.
// Tables 1 and 4 report manipulation success rates across three training seeds, by camera and demonstration count.
// Each task keeps its published standard deviation across seeds.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { grid, paperTables, checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2504.13059';
const board: Leaderboard = {
  benchmark: 'robotwin-1-0', static: 'paper', url, feed: url,
  terms: 'The RoboTwin authors publish these results at CVPR and on arXiv. https://arxiv.org/abs/2504.13059',
  headline: 'The paper reports no overall success rate, so this is the mean of its 14 task success rates.',
  async fetch() {
    const html = await paperHtml(url);
    const figures = [...html.matchAll(/<figure\b[\s\S]*?<\/figure>/gi)].map(m => m[0]);
    const rows: LeaderboardRow[] = [];
    const parts: Record<string, string> = {};
    for (const camera of ['D435', 'L515']) {
      const figure = figures.find(f => f.includes(camera + ' camera setting') && f.includes('Number of Demonstrations'));
      const t = figure && paperTables(figure).map(grid)[0];
      if (!t || t[0].join('|') !== 'Number of Demonstrations|20|50|100||20|50|100' || t.length !== 29) throw new Error('Missing RoboTwin task table for ' + camera);
      for (const [i, model] of ['DP3 (XYZ)', 'DP3 (XYZ+RGB)', 'DP'].entries()) {
        for (const j of [1, 2, 3]) {
          const metrics: Record<string, number> = {};
          const means: number[] = [];
          for (let k = 1; k < t.length; k += 4) {
            for (const col of [0, 4]) {
              const task = t[k][col];
              const result = t[k+1+i];
              const m = result[col+j].match(/^(\d+(?:\.\d+)?)\s*(?:\\pm|±)\s*(\d+(?:\.\d+)?)$/);
              if (!m || result[col] !== model || !task || task in metrics) throw new Error('Invalid RoboTwin task row');
              parts[task] = task;
              metrics[task] = Number(m[1]);
              metrics[task + ' SD'] = Number(m[2]);
              means.push(metrics[task]);
            }
          }
          rows.push({ model, setting: camera + ', ' + t[0][j] + ' demonstrations', trials: 3,
            metrics, score: means.reduce((a,b) => a+b, 0) / means.length });
        }
      }
    }
    board.parts = parts;
    return checked(rows, 18);
  },
};
export default board;
