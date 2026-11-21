// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// RefSpatial-Expand-Bench tests whether a model points inside a target object or a free placement area.
// The authors' dataset card gives success percentages for each task, scene type and reasoning depth.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://huggingface.co/datasets/JingkunAn/RefSpatial-Expand-Bench';
const feed = url + '/raw/main/README.md';
const board: Leaderboard = {
  benchmark: 'refspatial-expand-bench', url, feed,
  headline: 'The dataset card reports no combined score, so this is the plain mean of Location and Placement accuracy.',
  terms: 'The authors publish these results on Hugging Face under its terms. https://huggingface.co/terms-of-service',
  async fetch() {
    const text = await fetchText(feed);
    const models = ['RoboRefer-2B-SFT', 'RoboRefer-8B-SFT'];
    const rows = models.map(model => ({ model, score: 0, metrics: {} as Record<string, number> }));
    board.parts = {};
    for (const task of ['Location', 'Placement']) {
      const section = text.split('#### **' + task + ' Task**')[1]?.trimStart().split(/\n\s*\n/)[0];
      const grid = section?.split('\n').map(line => line.trim().split('|').slice(1, -1).map(s => s.trim()));
      if (grid?.[0].join('|') !== 'Category|2B SFT|8B SFT') throw Error('Missing ' + task + ' accuracy columns');
      const expected = ['Overall', 'Indoor', 'Outdoor', 'Step 1', 'Step 2', 'Step 3'];
      if (task === 'Placement') expected.push('Step 4', 'Step 5');
      if (grid.slice(2).map(c => c[0]).join('|') !== expected.join('|')) throw Error('Changed ' + task + ' categories');
      for (const [label, ...scores] of grid.slice(2)) {
        const key = label === 'Overall' ? task : task + ': ' + label;
        board.parts[key] = key;
        rows.forEach((row, i) => {
          if (!/^\d+(?:\.\d+)?$/.test(scores[i] ?? '')) throw Error('Missing score for ' + key);
          row.metrics[key] = Number(scores[i]);
        });
      }
    }
    for (const row of rows) row.score = (row.metrics.Location + row.metrics.Placement) / 2;
    return checked(rows, 2);
  },
};
export default board;
