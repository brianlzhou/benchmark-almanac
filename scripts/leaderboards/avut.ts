// AVUT tests audio-centric video understanding. Table 4 reports overall multiple-choice accuracy.
// Table 3 splits each task score between AV-Human and AV-Gemini in that order.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const feed = 'https://arxiv.org/html/2503.19951';
const tasks = ['AIE', 'ACC', 'AEL', 'AVCM', 'AVOM', 'AVTM'];
const splits = ['AV-Human', 'AV-Gemini'];
export default {
  benchmark: 'avut', static: 'paper', url: 'https://arxiv.org/abs/2503.19951', feed,
  terms: 'arXiv robots.txt allows this paper. Results are credited to the AVUT authors.',
  parts: Object.fromEntries(splits.flatMap(split => [
    [split, split], ...tasks.map(task => [split + task, { name: task, group: split }]),
  ])),
  aliases: { 'LLaVA-Video (7B)': 'llava-video-7b-qwen2' },
  async fetch() {
    const tables = inlinePaperTables((await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, ''));
    const table = tables.find(t => t[0]?.join('|') === ['Models', ...splits, 'Overall'].join('|'));
    const detail = tables.find(t => t[0]?.join('|') === ['Models', ...tasks.map(k => k + ' (%)')].join('|'));
    if (!table || !detail) throw new Error('Missing AVUT overall or task columns');
    const rows = table.slice(1).filter(row => !row.every(c => c === row[0])).map(([model, human, gemini, overall]) => {
      const taskRow = detail.find(row => row[0] === model);
      if (taskRow?.length !== 7) throw new Error('Missing AVUT tasks for ' + model);
      // The Gemini column for GPT-4o carries a footnote about its sampled evaluation.
      const metrics: Record<string, number> = { 'AV-Human': numberCell(human), 'AV-Gemini': numberCell(gemini.split(' ')[0]) };
      tasks.forEach((task, i) => {
        const pair = taskRow[i + 1].split('/').map(numberCell);
        if (pair.length !== 2) throw new Error('Missing AVUT task split for ' + model);
        splits.forEach((split, j) => { metrics[split + task] = pair[j]; });
      });
      return { model, score: numberCell(overall), metrics, ...(model === 'GPT-4o' ? { setting: '2,100-question sample' } : {}) };
    });
    if (rows.length < 12) throw new Error('AVUT expected at least twelve models');
    return rows;
  },
} satisfies Leaderboard;
