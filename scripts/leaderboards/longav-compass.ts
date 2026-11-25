// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// LongAV-Compass tests minute-long audio-video generation from text, images, and video.
// Tables 3 through 5 report event fulfillment first. The other diagnostics use different scales.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2605.26244';
const tasks = ['T2AV', 'I2AV', 'V2AV'];
const common = ['V_{QA}', 'VQ', 'Cont.', 'Trans', 'Hol.', 'TVAlign'];
const audio = ['AVS', 'AudQ', 'AudL'];

const commonNames: Record<string, string> = {
  VQ: 'Visual quality',
  'Cont.': 'Long-form continuity',
  Trans: 'Transition stability',
  'Hol.': 'Holistic presentation',
  TVAlign: 'Text-video alignment',
};
const audioNames: Record<string, string> = {
  AVS: 'Audio-video synchronization',
  AudQ: 'Audio quality',
  AudL: 'Long-audio coherence',
};

const board: Leaderboard = {
  benchmark: 'longav-compass',
  url: feed,
  feed,
  terms: 'The authors publish these results under the terms listed at https://arxiv.org/abs/2605.26244.',
  static: 'paper',
  headline: 'The paper reports no overall score, so this is the mean event fulfillment score across its three tasks.',
  aliases: {'Seedance 2.0': 'dreamina-seedance-2-0'},
  parts: Object.fromEntries(tasks.flatMap(task => [
    [task, {name: 'Event fulfillment', group: task, unit: 'score'}],
    ...Object.entries(commonNames).map(([col, name]) => [task + col.replace(/[^a-z0-9]/gi, ''), {name, group: task, unit: 'score'}]),
    ...(task === 'I2AV' ? [['I2AVIV1', {name: 'First-frame anchoring', group: task, unit: 'score'}], ['I2AVImgAlign', {name: 'Image alignment', group: task, unit: 'score'}]] : []),
    ...Object.entries(audioNames).map(([col, name]) => [task + col, {name, group: task, unit: 'score'}]),
  ])),
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const models = new Map<string, Record<string, number>>();
    for (const [i, task] of tasks.entries()) {
      const columns = [...common, ...(task === 'I2AV' ? ['IV_{1}', 'ImgAlign'] : []), ...audio];
      const table = tables[i + 2];
      if (table?.[1]?.join('|') !== ['Model', 'Aud.', ...columns].join('|')) throw new Error('Missing ' + task + ' columns');
      for (const [model, hasAudio, ...cells] of table.slice(2)) {
        if (model === hasAudio && model.endsWith('Models')) continue;
        if (!['Yes', 'No'].includes(hasAudio) || cells.length !== columns.length) throw new Error('Unexpected ' + task + ' row');
        const metrics = models.get(model) ?? {};
        for (const [j, name] of columns.entries()) {
          const key = j === 0 ? task : task + name.replace(/[^a-z0-9]/gi, '');
          if (['–', 'N/A'].includes(cells[j])) continue;
          if (key in metrics) throw new Error('Duplicate ' + model + ' ' + key);
          metrics[key] = numberCell(cells[j]);
        }
        models.set(model, metrics);
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, metrics] of models) {
      if (tasks.every(task => task in metrics)) rows.push({model, metrics, score: tasks.reduce((sum, task) => sum + metrics[task], 0) / tasks.length});
    }
    return checked(rows, 4);
  },
};
export default board;
