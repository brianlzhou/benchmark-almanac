// RELATE asks models to predict how well an audio clip matches its caption.
// Table 6 reports Spearman correlation, the validation metric used for model selection.
// Table 7 gives the same correlation for each sound category.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2506.23582';
const categories = ['Human sounds', 'Animal', 'Natural sounds', 'Music', 'Sounds of things',
  'Source-ambiguous sounds', 'Channel, environment and background', 'Speech'];
const board: Leaderboard = {
  benchmark: 'relate-audio-text', static: 'paper', url: feed, feed,
  terms: 'The ISCA Archive publishes the authors’ paper at https://www.isca-archive.org/interspeech_2025/kanamori25_interspeech.html.',
  parts: Object.fromEntries(categories.map(name => [name, name])),
  stats: {
    mse: { name: 'Mean squared error', unit: 'score', better: 'lower' },
    lcc: { name: 'Linear correlation coefficient', unit: 'score', better: 'higher' },
    ktau: { name: 'Kendall rank correlation', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const overall = tables.find(t => t[0].map(cell => cell.split(' ')[0]).join('|') === 'Method|MSE|LCC|SRCC|KTAU');
    const parts = tables.find(t => t[1]?.join('|') === 'Method|Human|Animal|Natural|Music|Sounds|ambiguous|environment|Speech');
    if (!overall || !parts) throw new Error('Missing RELATE results columns');
    const rows = overall.slice(1).filter(r => !r[0].startsWith('Ours')).map(row => {
      const [harness, model] = row[0].split(' w/ ');
      const scores = parts.find(r => r[0] === row[0]);
      if (!model || scores?.length !== categories.length + 1) throw new Error('Missing RELATE category scores');
      return {model, harness, score: numberCell(row[3]), metrics: {
        mse: numberCell(row[1]), lcc: numberCell(row[2]), ktau: numberCell(row[4]),
        ...Object.fromEntries(categories.map((key, i) => [key, numberCell(scores[i + 1])])) }};
    });
    return checked(rows, 2);
  },
};
export default board;
