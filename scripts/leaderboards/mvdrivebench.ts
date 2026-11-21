// MVDriveBench tests driving reasoning from synchronized camera views.
// Tables II and III report overall accuracy and task accuracy with surround-view and front-view inputs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2611.15225';
const tasks = ['Rel. Mot.', 'Obj. Mot.', 'Tracking', 'Ego Mot.', 'Avg', 'Intent', 'Cross-view',
  'Key Obj.', 'Key Event', 'Risk', 'Avg', 'Planning', 'Counterfactual', 'Rationality', 'Avg'];
const keys = ['relativeMotion', 'objectMotion', 'tracking', 'egoMotion', 'dynamicMotion', 'intent',
  'crossView', 'keyObject', 'keyEvent', 'risk', 'sceneUnderstanding', 'planning', 'counterfactual',
  'rationality', 'drivingReasoning'];
const averages: Record<string, string> = {
  dynamicMotion: 'Dynamic Motion Understanding', sceneUnderstanding: 'Multi-view Scene Understanding', drivingReasoning: 'Driving Reasoning',
};
const board: Leaderboard = {
  benchmark: 'mvdrivebench', static: 'paper', feed, url: feed,
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  aliases: { 'LLaVA-OneVision-Qwen2-7B-OV': 'llava-onevision-7b' },
  parts: Object.fromEntries(keys.map((key, i) => [key, averages[key] ?? tasks[i]])),
  async fetch() {
    const html = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    for (const [id, setting] of [['S3.T2', 'Surround-view'], ['S3.T3', 'Front-view']]) {
      const figure = html.split('<figure id="' + id + '"')[1]?.split('</figure>')[0];
      const table = figure && flatPaperTables(figure).map(grid)[0];
      if (!table || table[1]?.join('|') !== ['Model', 'Overall', ...tasks].join('|')) throw Error('Missing ' + setting + ' accuracy columns');
      for (const [model, overall, ...parts] of table.slice(2)) {
        if (model === 'Human' || model === overall) continue;
        if (parts.length !== keys.length) throw Error('Missing task accuracy for ' + model);
        const score = numberCell(overall.split(/\\(?:up|down)arrow/)[0]);
        rows.push({ model, score, setting, metrics: Object.fromEntries(parts.map((p,i) => [keys[i], numberCell(p)])) });
      }
    }
    return checked(rows, 46);
  },
};
export default board;
