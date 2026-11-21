// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// LongHealth tests question answering from patient records. Tables 3 to 5 give accuracy and ranges over five runs.
import type { Leaderboard } from './types.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2401.14490';
const tasks = ['Task 1', 'Task 2', 'Task 3'];
const board: Leaderboard = {
  benchmark: 'longhealth', feed, url: feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: { 'Task 1': 'Task 1: Single-patient information extraction', 'Task 2': 'Task 2: Information extraction with distractors',
    'Task 3': 'Task 3: Insufficient information' },
  headline: 'The paper reports no overall accuracy, so this is the plain mean of the three task accuracies.',
  async fetch() {
    const paper = await paperHtml(feed);
    const byModel = new Map<string, Record<string, number>>();
    for (const figure of paper.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/g)) {
      const task = figure[0].match(/Model performance on (Task [123])/)?.[1];
      if (!task) continue;
      const table = flatPaperTables(figure[0]).map(grid).find(t => t[0]?.join('|') === 'Model Architecture|Accuracy|Accuracy Range');
      if (!table) throw Error('Missing accuracy range for ' + task);
      for (const [model, value, range] of table.slice(1)) {
        if (!model && !value && !range) continue;
        const bounds = range.match(/^(\d+)%-([0-9]+)%$/);
        if (!bounds || !/^\d+%$/.test(value)) throw Error('Invalid accuracy for ' + model);
        const metrics = byModel.get(model) ?? {};
        metrics[task] = parseInt(value);
        metrics[task + ' minimum'] = Number(bounds[1]);
        metrics[task + ' maximum'] = Number(bounds[2]);
        byModel.set(model, metrics);
      }
    }
    return checked([...byModel].filter(([, m]) => tasks.every(t => t in m)).map(([model, metrics]) => ({
      model, metrics, score: tasks.reduce((s, t) => s + metrics[t], 0) / tasks.length,
      trials: 5, setting: '16,000-token prompt',
    })), 10);
  },
};
export default board;
