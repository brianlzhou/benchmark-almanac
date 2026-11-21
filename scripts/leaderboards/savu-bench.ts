// The source reports no overall score. The headline is the plain mean of the 7 parts, computed by this importer.
// SAVU-Bench tests spatial understanding from audio and video. Table 2 gives average accuracy for each task.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { text } from '../lib/html.ts';

const feed = 'https://arxiv.org/html/2610.10624';
const tasks = ['Audio Grounding', 'Visual Grounding', 'Semantic Alignment', 'Spatial Alignment', 'Joint A2V', 'Joint V2A', 'Spatial Reasoning'];
const board: Leaderboard = {
  benchmark: 'savu-bench', feed, url: feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The paper reports no overall score, so this is the plain mean of its seven task accuracies.',
  parts: Object.fromEntries(tasks.map(task => [task, task])),
  async fetch() {
    const paper = await paperHtml(feed);
    const figure = paper.match(/<figure id="S3\.T2"[^>]*>[\s\S]*?<\/figure>/)?.[0];
    const table = figure?.split(/<span[^>]*class="ltx_tr"[^>]*>/).slice(1)
      .map(row => row.split(/<span[^>]*class="ltx_td\b[^"]*"[^>]*>/).slice(1).map(text));
    if (table?.[1]?.join('|') !== tasks.join('|') || !figure?.includes('Results on SAVU-Bench')) throw Error('Missing SAVU-Bench Table 2');
    const rows = table.slice(2).filter(([model]) => !['Chance †', 'Closed-source Models', 'Open-weight Models'].includes(model));
    return checked(rows.map(([model, ...cells]) => {
      if (cells.length !== tasks.length || !cells.every(s => /^\d+\.\d+$/.test(s))) throw Error('Incomplete task accuracies: ' + model);
      const metrics = Object.fromEntries(tasks.map((task, i) => [task, Number(cells[i])]));
      return { model, score: Object.values(metrics).reduce((sum, v) => sum + v, 0) / tasks.length, metrics };
    }), 12);
  },
};
export default board;
