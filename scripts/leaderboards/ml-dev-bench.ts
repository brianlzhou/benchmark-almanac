// ML-Dev-Bench tests whether agents complete machine learning development tasks.
// Table 2 reports the share of all 30 tasks solved by each agent and model, plus six category success rates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2502.00964';
const board: Leaderboard = {
  benchmark: 'ml-dev-bench', static: 'paper', url: feed, feed,
  terms: 'The authors publish this table under the terms listed at https://arxiv.org/abs/2502.00964.',
  stats: { tasksSolved: {name:'Tasks solved',unit:'count',better:'higher'} },
  parts: { DatasetHandling: 'Dataset Handling', APIIntegration: 'API Integration', ModelTraining: 'Model Training', Debugging: 'Debugging', ModelImplementation: 'Model Implementation', ModelPerformance: 'Model Performance' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === 'Category|ReAct-Sonnet|OH-Sonnet|OH-Gemini|Aide-4o|ReAct-4o');
    if (!table || table.at(-1)?.[0] !== 'Overall' || table.length !== 8) throw new Error('Missing ML-Dev-Bench results');
    const configs = [['ReAct', 'Claude 3.5 Sonnet'], ['OpenHands', 'Claude 3.5 Sonnet'], ['OpenHands', 'Gemini 2.0 Flash (snapshot unspecified)'],
      ['AIDE', 'GPT-4o'], ['ReAct', 'GPT-4o']];
    const rows: LeaderboardRow[] = configs.map(([harness, model], i) => {
      const metrics: Record<string, number> = {};
      let score = NaN;
      for (const r of table.slice(1)) {
        const match = r[i + 1]?.match(/^(\d+)% \((\d+)\/(\d+)\)$/);
        if (!match) throw new Error('Missing success rate');
        const value = numberCell(match[1]);
        if (r[0] === 'Overall') {
          score = value;
          metrics.tasksSolved = Number(match[2]);
        } else {
          const key = r[0].replaceAll(' ', '');
          metrics[key] = value;
        }
      }
      return {model, harness, score, metrics};
    });
    return checked(rows, 5);
  },
};
export default board;
