// ProteinLMBench tests protein understanding with multiple-choice questions. Table 3 reports the percentage
// correct and inference time in minutes for the evaluation cohort.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2406.05540';
const board: Leaderboard = {
  benchmark: 'proteinlmbench', static: 'paper', url: 'https://arxiv.org/abs/2406.05540', feed, terms: PAPER_TERMS,
  stats: { inferenceMinutes: { name: 'Inference time', unit: 'minutes', better: 'lower' } },
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const table = tables.find(t => t[1]?.join('|') === 'Model|Correct Rate (%)|Inference Time (minutes)');
    if (!table || table.length < 20) throw new Error('Missing ProteinLMBench results');
    return table.slice(2).map(([name, accuracy, minutes]) => ({
      model: name.replace(' (w/o SSL)', ''), setting: name.includes('(w/o SSL)') ? 'w/o SSL' : undefined,
      score: numberCell(accuracy), metrics: { inferenceMinutes: numberCell(minutes) },
    }));
  },
};
export default board;
