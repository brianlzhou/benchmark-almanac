// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// LOKI tests whether models recognize synthetic content. Table 2(a) gives overall accuracy for judgment and multiple choice.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2410.09732';
const tasks = ['Judgment', 'Multiple Choice'];
const modalities = ['Video', 'Image', '3D', 'Text', 'Overall'];
const parts: Record<string, BoardPart> = {};
for (const task of tasks) {
  for (const modality of modalities) parts[task + modality] = { name: modality, group: task };
}

const board: Leaderboard = {
  benchmark: 'loki', feed, url: feed, static: 'paper', parts,
  aliases: { 'Qwen2-VL-72B': 'qwen2-vl-72b-instruct', 'LLaVA-OV-72B': 'llava-onevision-72b' },
  headline: 'This is the plain mean of the overall judgment and multiple choice accuracies in the multimodal evaluation.',
  terms: 'The authors list the paper license at https://arxiv.org/abs/2410.09732.',
  async fetch() {
    const table = inlinePaperTables(await paperHtml(feed)).find(t =>
      t[0]?.join('|') === ['', ...tasks.flatMap(task => modalities.map(() => task))].join('|') &&
      t[1]?.join('|') === ['', ...modalities, ...modalities].join('|'));
    if (!table) throw new Error('Missing LOKI multimodal results');
    const rows: LeaderboardRow[] = [];
    for (const [label, ...cells] of table.slice(2)) {
      if (['Human (Medium)', 'Random Choice', 'Expert models'].includes(label)) continue;
      const metrics = Object.fromEntries(Object.keys(parts).map((key, i) => [key, numberCell(cells[i])]));
      rows.push({ model: label.replace(/\*$/, ''), score: (metrics.JudgmentOverall + metrics['Multiple ChoiceOverall']) / 2, metrics });
    }
    return checked(rows, 20);
  },
};
export default board;
