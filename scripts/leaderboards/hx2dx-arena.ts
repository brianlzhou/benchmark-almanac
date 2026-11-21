// Hx2Dx compares clinical diagnoses after an interview and after reading the complete case.
// "Diagnostic accuracy is the proportion of cases graded correct or partially correct by the Examiner."
// Table 2 gives the interview verdict counts and the results text reports the static accuracies.
import type { Leaderboard } from './types.ts';
import { text } from '../lib/html.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.14122';
const board: Leaderboard = {
  benchmark: 'hx2dx-arena', url: feed, feed, static: 'paper',
  terms: 'The authors publish the verdict table at https://arxiv.org/abs/2611.14122.',
  aliases: { 'GPT Luna 6': 'gpt-6-luna', 'Gemma 3 27B IT': 'gemma-3-27b' },
  stats: {
    correct: { name: 'Correct diagnoses', unit: 'count', better: 'higher' },
    partial: { name: 'Partially correct diagnoses', unit: 'count', better: 'higher' },
    incorrect: { name: 'Incorrect diagnoses', unit: 'count', better: 'lower' },
  },
  async fetch() {
    const html = await paperHtml(feed);
    const table = paperTables(html).map(grid).find(t => t[0]?.join('|') === 'Model|Correct|Partially correct|Incorrect');
    const staticResults = text(html).split('In the static setting, where the complete case was available upfront,')[1]?.split('Every model lost accuracy')[0];
    if (!table || !staticResults) throw new Error('Missing Hx2Dx results');
    return checked(table.slice(1).flatMap(row => {
      const model = row[0];
      const [correct, partial, incorrect] = row.slice(1).map(numberCell);
      const trials = correct + partial + incorrect;
      if (trials !== 1000) throw new Error('Unexpected Hx2Dx verdict count');
      const percent = staticResults.split(model)[1]?.match(/^(?: achieved the highest static accuracy)?\s*\(([\d.]+)%\)/);
      if (!percent) throw new Error('Missing static accuracy for ' + model);
      return [
        { model, score: (correct + partial) / 10, setting: 'Conversational', trials, metrics: { correct, partial, incorrect } },
        { model, score: numberCell(percent[1]), setting: 'Static', trials },
      ];
    }), 14);
  },
};
export default board;
