// Fin-Fact tests whether models can verify financial claims. Table 3 reports F1 for the claim labels.
// The table also prints numeric subscripts without defining their statistical meaning.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2309.08793';
const columns = ['Precision', 'Recall', 'F1-Score', 'Accuracy'];
const board: Leaderboard = {
  stats: { PrecisionSubscript: { name: 'Precision subscript', unit: 'count' }, RecallSubscript: { name: 'Recall subscript', unit: 'count' }, 'F1-Score': { name: 'F1 score', unit: '%', better: 'higher' }, 'F1-ScoreSubscript': { name: 'F1 score subscript', unit: 'count' }, AccuracySubscript: { name: 'Accuracy subscript', unit: 'count' } },
  benchmark: 'fin-fact', static: 'paper', feed, url: feed,
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  aliases: { 'Mistral(8x7b)': 'mixtral-8x7b', 'Claude3-Opus': 'claude-3-opus' },
  parts: { Precision: 'Precision', Recall: 'Recall', Accuracy: 'Accuracy' },
  async fetch() {
    const header = ['Model Type', 'Model', ...columns, 'Modality'];
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => JSON.stringify(t[0]) === JSON.stringify(header));
    if (!table || table[2]?.[6] !== 'Text, Image' || table[6]?.[6] !== 'Text' || table.length !== 17)
      throw Error('Fin-Fact classification columns or modality groups changed');
    return checked(table.slice(1).map((cells, index) => {
      const metrics: Record<string, number> = {};
      for (const [i, column] of columns.entries()) {
        const pair = cells[i + 2].match(/^(\d+\.\d+)_\{(\d+\.\d+)\}$/);
        if (!pair) throw Error('Invalid ' + column + ' for ' + cells[1]);
        metrics[column] = Number((Number(pair[1]) * 100).toFixed(3));
        metrics[column + 'Subscript'] = Number((Number(pair[2]) * 100).toFixed(3));
      }
      return { model: cells[1], setting: index < 4 ? 'Text, Image' : 'Text', score: metrics['F1-Score'], metrics };
    }), 16);
  },
};
export default board;
