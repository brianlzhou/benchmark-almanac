// CSL evaluates classification and text generation on Chinese scientific papers. Table 3 reports
// accuracy, ROUGE-L, and Bpref. The headline uses its first column, category accuracy in percent.
// The authors pretrained these models on Chinese text.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2209.05034';

const board: Leaderboard = {
  benchmark: 'csl', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2209.05034",
  headline: 'Table 3 reports no overall score, so the headline is its first column, category classification accuracy in percent.',
  parts: {
    category: {name: 'Category classification', unit: '%'},
    discipline: {name: 'Discipline classification', unit: '%'},
    summarization: {name: 'Text summarization', unit: 'score', note: 'ROUGE-L as reported in Table 3.'},
    keywords: {name: 'Keyword generation', unit: 'score', note: 'Bpref as reported in Table 3.'},
  },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[1]?.join('|') === 'Models|Acc.|Acc.|R-L|Bpref.');
    if (!table || !table[0][1].startsWith('CTG') || !table[0][2].startsWith('DCP')) throw new Error('Missing CSL downstream results');
    const rows: LeaderboardRow[] = table.slice(2).map(([label, ...cells]) => {
      if (cells.length !== 4) throw new Error('Missing task score');
      const [category, discipline, summarization, keywords] = cells.map(numberCell);
      const single = label.endsWith(' (single)');
      const name = label.replace(' (single)', '');
      const model = name === 'CSL-T5' ? name : name + ' (Chinese pretraining)';
      return {model, setting: single ? 'Single-task' : 'Multitask', score: category, metrics: {category, discipline, summarization, keywords}};
    });
    return checked(rows, 5);
  },
};
export default board;
