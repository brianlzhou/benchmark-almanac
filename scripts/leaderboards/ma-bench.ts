// MA-Bench evaluates written mission-analysis briefs. Table 4 reports the mean severity-weighted score across ten scenarios.
// The source expresses scores as fractions. Multiply scores and their confidence limits by 100 for the catalog.
import type { Leaderboard } from './types.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2610.19138';
const board: Leaderboard = {
  benchmark: 'ma-bench', url: feed, feed, static: 'paper',
  stats: {
    briefs: { name: 'Briefs', unit: 'count' },
    geminiJudge: { name: 'Gemini judge score', unit: '%', better: 'higher' },
    correct: { name: 'Correct rate', unit: '%', better: 'higher' },
    passed: { name: 'Passed rate', unit: '%', better: 'higher' },
    wrongMoves: { name: 'Wrong moves', unit: 'count', better: 'lower' },
    criticallyDetrimental: { name: 'Critically detrimental moves', unit: 'count', better: 'lower' },
  },
  terms: 'Scale AI publishes the benchmark results under CC BY 4.0 at https://huggingface.co/datasets/ScaleAI/MA-Bench.',
  async fetch() {
    const header = ['MODEL', 'BRIEFS', 'SCORE (95% CI)', 'GEMINI JUDGE', 'CORRECT %', 'PASSED %', 'WRONG MOVES (CD)'];
    const table = inlinePaperTables(await paperHtml(feed)).find(t => t[0]?.join('|') === header.join('|'));
    if (!table) throw new Error('Missing MA-Bench Table 4');
    const rows = table.slice(1).map(([name, briefs, estimate, gemini, correct, passed, errors]) => {
      const interval = estimate.match(/^(-?[\d.]+) \((-?[\d.]+), (-?[\d.]+)\)$/);
      const counts = errors.match(/^([\d.]+) \(([\d.]+)\)$/);
      if (!interval || !counts) throw new Error('Invalid Table 4 interval or count for ' + name);
      const [score, low, high] = interval.slice(1).map(v => numberCell(v) * 100);
      return {
        model: name.replace(/\s+\\(?:circ|diamond|dagger)$/, ''), score, low, high,
        setting: '3,000-word cap, medium reasoning where supported',
        metrics: { briefs: numberCell(briefs), geminiJudge: numberCell(gemini) * 100,
          correct: numberCell(correct), passed: numberCell(passed), wrongMoves: numberCell(counts[1]),
          criticallyDetrimental: numberCell(counts[2]) },
      };
    });
    return checked(rows, 20);
  },
};
export default board;
