// CapQuiz evaluates video captions using human-verified questions. Table 3 reports
// overall CapF1 and precision and recall for descriptive and inferential questions.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2609.09973';
const board: Leaderboard = {
  benchmark: 'capquiz', static: 'paper', url, feed: url,
  terms: 'Apple credits the authors and links the paper at https://machinelearning.apple.com/research/video-caption-quality.',
  aliases: {'GPT-5.2-2025-12-11': 'gpt-5-2', 'GPT-4.1-2025-04-14': 'gpt-4-1'},
  parts: { descriptive: 'Descriptive', inferential: 'Inferential' },
  stats: Object.fromEntries(['CapP','CapR','Descriptive precision','Descriptive recall',
    'Inferential precision','Inferential recall'].map(name => [name, {name, unit: 'score', better: 'higher' as const}])),
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t =>
      t[0]?.join('|') === 'Model|Overall|Overall|Overall|Descriptive|Descriptive|Descriptive|Inferential|Inferential|Inferential'
      && t[1]?.join('|') === 'Model|F1|P|R|F1|P|R|F1|P|R' && /^\d+\.\d+$/.test(t[3]?.[1]));
    if (!table) throw new Error('Missing main results in Table 3');
    const keys = ['CapP','CapR','descriptive','Descriptive precision','Descriptive recall',
      'inferential','Inferential precision','Inferential recall'];
    return checked(table.slice(2).filter(r => !r.every(c => c === r[0])).map(r => {
      if (r.length !== 10) throw new Error('CapQuiz table width changed');
      return {model: r[0].replace(/\s*\(\s*\d{4}\s*\)$/, ''), score: numberCell(r[1]),
        metrics: Object.fromEntries(keys.map((key,i) => [key, numberCell(r[i+2])]))};
    }), 15);
  },
};
export default board;
