// RQA-70K tests rating and written assessment of weather radar forecasts for frames and sequences.
// Tables 2 and 3 use different scales. The headline is the first table's overall frame-rating accuracy.
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';
const feed = 'https://arxiv.org/html/2508.12291';
const ratings = {Frame: ['Overall','False Alarm','Miss','High Value','Sharpness'], Sequence: ['Overall','Dynamic Consistency','Cumulate Precipitation','High Value Retain']};
const assessments = ['BLEU','BERTScore','ROUGE_L','METEOR','GPT4Score'];
const partLabels = Object.fromEntries([
  ...(['Frame', 'Sequence'] as const).flatMap(domain => [
    ...ratings[domain].map(name => [domain + ' rating ' + name, {name, group: domain + ' rating', unit: '%'}]),
    ...assessments.map(name => [domain + ' assessment ' + name, {name, group: domain + ' assessment', unit: 'score'}]),
  ]),
]);
const board: Leaderboard = {
  benchmark: 'rqa-70k', url: feed, feed, static: 'paper', parts: partLabels, aliases: {'Claude3.7 sonnet': 'claude-3-7-sonnet'},
  terms: 'The authors publish the paper under the terms linked at https://arxiv.org/abs/2508.12291.',
  headline: 'The paper reports separate rating and assessment metrics. The headline is overall frame-rating accuracy from Table 2.',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const models = new Map<string, LeaderboardRow>();
    for (const domain of ['Frame','Sequence'] as const) {
      const names = [...ratings[domain], ...assessments];
      const table = tables.find(t => t[0][2] === domain + ' Rating' && t[1].slice(2).join('|') === names.join('|'));
      if (!table) throw new Error('Missing main table for ' + domain);
      for (const [, model, ...cells] of table.slice(2)) {
        if (cells.length !== names.length) throw new Error('Incomplete row for ' + model);
        const row = models.get(model) ?? {model, score: NaN, metrics: {}};
        if (domain === 'Frame') row.score = numberCell(cells[0]);
        names.forEach((name, i) => {
          const rating = i < ratings[domain].length;
          const group = domain + (rating ? ' rating' : ' assessment');
          const key = group + ' ' + name;
          board.parts![key] = {name, group, unit: rating ? '%' : 'score'};
          row.metrics![key] = numberCell(cells[i]);
        });
        models.set(model, row);
      }
    }
    return checked([...models.values()], 8);
  },
};
export default board;
