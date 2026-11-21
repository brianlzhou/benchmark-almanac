// FML-bench tests whether research agents improve eight machine learning baselines.
// Table 2 gives task scores with different directions. Generalization is its first task.
// Table 3 gives the mean resources and step statistics for each agent and model.
import type { Leaderboard } from './types.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2510.10472';
const parts = {
  generalization: 'Generalization', dataEfficiency: 'Data efficiency',
  representationLearning: 'Representation learning', continualLearning: 'Continual learning',
  causality: { name: 'Causality', better: 'lower' }, robustness: 'Robustness and reliability',
  privacy: { name: 'Privacy', better: 'lower' }, fairness: { name: 'Fairness and bias', better: 'lower' },
} as const;
const names = ['Generalization', 'Data Eff.', 'Rep. Learn.', 'Cont. Learn.', 'Causality', 'Robust. & Rel.', 'Privacy', 'Fair. & Bias'];
const board: Leaderboard = {
  benchmark: 'fml-bench', static: 'paper', url: feed, feed, parts,
  headline: 'The paper reports no overall score. The headline shows Generalization, the first task in Table 2.',
  terms: 'The authors publish this paper on arXiv under the terms at https://arxiv.org/abs/2510.10472.',
  aliases: { 'Opus-4.1': 'claude-opus-4-1', 'G2.5-Pro': 'gemini-2-5-pro-jun-2025' },
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(feed));
    const table = tables.find(t => t[0]?.[0] === 'ML Problems' && t[0][1] === 'Baseline');
    const costs = tables.find(t => t[0]?.[0] === 'Metrics' && t[2]?.[0] === 'Exploration Diversity');
    if (!table || !costs || names.some((name, i) => !table[i + 2]?.[0].startsWith(name))) throw new Error('Missing FML-bench results');
    const extra = [
      ['Exploration Diversity', 'explorationDiversity', 1], ['Step Success Rate', 'stepSuccessRate', 1],
      ['Step Completion Rate', 'stepCompletionRate', 1], ['Total Token Cons.', 'totalTokens', 1e6],
      ['Step Token Cons.', 'tokensPerStep', 1e6], ['Total Time Cons.', 'totalHours', 1],
      ['Step Time Cons.', 'minutesPerStep', 1],
    ] as const;
    return checked(table[1].slice(2).map((model, i) => {
      if (costs[1][i + 1] !== model || costs[0][i + 1] !== table[0][i + 2]) throw new Error('Resource columns changed');
      const metrics = Object.fromEntries(Object.keys(parts).map((key, j) => [key, numberCell(table[j + 2][i + 2])]));
      for (const [label, key, scale] of extra) {
        const cell = costs.find(row => row[0].startsWith(label))?.[i + 1];
        if (cell?.startsWith('N/A')) continue;
        if (!cell?.includes('±')) throw new Error('Missing FML-bench statistic: ' + label);
        const [mean, spread] = cell.split('±').map(v => numberCell(v.trim()) * scale);
        metrics[key] = mean;
        metrics[key + 'Std'] = spread;
      }
      return { model, harness: table[0][i + 2], score: metrics.generalization, metrics };
    }), 5);
  },
};
export default board;
