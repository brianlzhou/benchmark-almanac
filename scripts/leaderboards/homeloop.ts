// HomeLoop tests agents that respond to household alerts and coordinate robots and connected devices.
// Table 3 ranks models by balanced success over 20 tasks at two seeds. Table 11 identifies reasoning effort.
import type { Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2611.08914';
const board: Leaderboard = {
  benchmark: 'homeloop', static: 'paper', url: feed, feed, costPer: 'run',
  terms: 'The authors publish the paper under the terms at https://arxiv.org/abs/2611.08914.',
  aliases: { Astra: 'gpt-6-astra', 'Luna 6': 'gpt-6-luna', 'Sonnet 5': 'claude-sonnet-5' },
  parts: { hazards: 'Hazards', requests: 'Requests', entry: 'Entry', wellbeing: 'Wellbeing', chores: 'Chores', alertGroups: 'Alert groups' },
  async fetch() {
    const all = flatPaperTables(await paperHtml(feed)).map(grid);
    const results = all.find(t => t[0].join('|') === 'Model|Passed (seed 0, 1)|Balanced %|Hazards %|Requests %|Entry %|Wellbeing %|Chores %|Alert groups %|Skill cost %|USD (total)');
    const failures = all.find(t => t[0].join('|') === 'Model|Failed|Over|Under|Evidence|Physical|Report|Limit');
    const ids = all.find(t => t[0].join('|') === 'Name|Identifier|Reasoning');
    if (!results || !failures || !ids) throw new Error('Missing HomeLoop scores or model information');
    return checked(results.slice(1).map(r => {
      const model = r[0];
      const id = ids.find(v => v[0] === model);
      const failed = failures.find(v => v[0] === model);
      if (!id || !failed) throw new Error('Missing HomeLoop model metadata');
      const [seed0, seed1] = r[1].split(',').map(v => numberCell(v.trim()));
      const metrics: Record<string, number> = { seed0Passed: seed0, seed1Passed: seed1, skillCostPercent: numberCell(r[9]) };
      Object.keys(board.parts!).forEach((key, i) => { metrics[key] = numberCell(r[i + 3]); });
      failures[0].slice(1).forEach((key, i) => { metrics['failure' + key] = numberCell(failed[i + 1]); });
      return { model, score: numberCell(r[2]), setting: id[2] + ' reasoning', cost: numberCell(r[10]), trials: 2, metrics };
    }), 6);
  },
};
export default board;
