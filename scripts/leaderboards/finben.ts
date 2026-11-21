// FinBen evaluates finance tasks with different scales and directions. Tables 3 and 6 list NER entity F1 first.
// The authors average three runs and mark results from previous work with an asterisk.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2402.12659';
const board: Leaderboard = {
  benchmark: 'finben', url: feed, feed,
  terms: 'The authors publish the table through arXiv. https://arxiv.org/abs/2402.12659',
  aliases: { 'LLaMA2 7B-chat': 'llama-2-7b' },
  async fetch() {
    const matrices = paperTables(await paperHtml(feed)).map(grid)
      .filter(t => t[0]?.[0] === 'Dataset' && t[0]?.[1] === 'Metrics' && t[1]?.[0] === 'NER' && t[1]?.[1] === 'EntityF1');
    if (matrices.length !== 2) throw new Error('FinBen main results or appendix results missing');
    const rows: LeaderboardRow[] = [];
    const parts: Record<string, BoardPart> = {};
    for (const table of matrices) {
      const models = table[0].slice(2);
      models.forEach((model, i) => {
        if (!model) return;
        const metrics: Record<string, number> = {};
        for (const row of table.slice(1)) {
          const dataset = row[0] === 'MA' ? 'M&A' : row[0];
          const measure = row[1].replace('\\downarrow', '');
          const key = dataset + '_' + measure;
          const value = row[i + 2]?.replace(/\s*\*$/, '');
          if (value === '-' || value === '') continue;
          // The Falcon ECTSUM BartScore cell prints two minus signs separated by a space.
          if (value === '- -5.18' && model === 'Falcon 7B' && key === 'ECTSUM_BartScore') continue;
          if (!/^-?\d+(?:\.\d+)?$/.test(value)) throw new Error('Invalid FinBen score for ' + key);
          metrics[key] = Number(value);
          parts[key] = { name: dataset + ': ' + measure, unit: 'score', better: measure === 'RMSE' ? 'lower' : 'higher' };
        }
        const score = metrics.NER_EntityF1;
        if (!Number.isFinite(score)) throw new Error('Missing NER entity F1 for ' + model);
        rows.push({ model, score, metrics, trials: table[1][i + 2].includes('*') ? undefined : 3 });
      });
    }
    board.parts = parts;
    return checked(rows, 16);
  },
};
export default board;
