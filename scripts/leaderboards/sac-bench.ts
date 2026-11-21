// SAC-Bench tests whether audio models follow acoustic evidence when speech contradicts it.
// Table 3 reports separate task measures. Its first task, Event Presence, uses recording-level balanced accuracy.
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';
const feed = 'https://arxiv.org/html/2611.00325';
const board: Leaderboard = {
  benchmark: 'sac-bench', url: feed, feed, static: 'paper',
  headline: 'The paper reports no overall score. The headline is recording-level balanced accuracy on Event Presence.',
  aliases: {'Qwen3-Omni': 'qwen3-omni-30b-a3b'},
  parts: {presence: 'Event Presence (balanced accuracy)', identity: 'Event Identity (accuracy)', order: 'Temporal Order (accuracy)'},
  terms: 'The authors publish their results under the terms linked at https://arxiv.org/abs/2611.00325.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0].join('|') === 'Model|Audio-only|Compatible|Conflict|Gap|SFR');
    if (!table) throw new Error('Missing Table 3 condition columns');
    const keys: Record<string, string> = {'Event Presence (BAcc)': 'presence', 'Event Identity (accuracy)': 'identity', 'Temporal Order (accuracy)': 'order'};
    const models = new Map<string, LeaderboardRow>();
    let task = '';
    for (const [model, ...cells] of table.slice(1)) {
      if (new Set([model, ...cells]).size === 1) { task = keys[model]; continue; }
      if (!task || cells.length !== 5) throw new Error('Unexpected Table 3 task or row');
      const values = cells.map(numberCell);
      for (const [i, condition] of table[0].slice(1,4).entries()) {
        const key = model + '/' + condition;
        const row = models.get(key) ?? {model, setting: 'Neutral prompt, ' + condition, score: NaN, metrics: {}};
        row.metrics![task] = values[i];
        if (task === 'presence') row.score = values[i];
        if (condition === 'Conflict') Object.assign(row.metrics!, {[task + 'Gap']: values[3], [task + 'SFR']: values[4]});
        models.set(key, row);
      }
    }
    return checked([...models.values()], 15);
  },
};
export default board;
