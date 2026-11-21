// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// ProofRank compares the quality of correct mathematical proofs. MathArena reports one Elo rating per dimension.
// The accuracy column gives the fraction of solutions passing the correctness filter.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://matharena.ai/proofrank/';
const parts = { conciseness: 'Conciseness', ease: 'Computational ease', simplicity: 'Cognitive simplicity', diversity: 'Diversity', adaptivity: 'Adaptivity' };
export default {
  benchmark: 'proofrank', url, feed: url, parts,
  headline: 'MathArena reports no combined Elo, so this is the mean of the five proof-quality ratings.',
  terms: 'MathArena publishes this results table and its methodology. https://matharena.ai/proofrank/',
  stats: { accuracy: { name: 'Accuracy', unit: '%', better: 'higher' } },
  aliases: { 'Kimi-K2.5-Think': 'kimi-k2-5' },
  async fetch() {
    const header = ['Model', 'Conciseness', 'Comp. Ease', 'Cognitive Simplicity', 'Diversity', 'Adaptivity', 'Accuracy'];
    const table = paperTables(await fetchText(url)).map(grid).find(t => t[0]?.join('|') === header.join('|'));
    if (!table) throw new Error('Missing ProofRank results');
    return checked(table.slice(1).map(([model, ...cells]) => {
      const accuracy = cells.pop();
      if (!accuracy || !/^\d+(\.\d+)?%$/.test(accuracy) || cells.length !== 5 || cells.some(s => !/^-?\d+(\.\d+)?$/.test(s))) throw new Error('Invalid ProofRank row for ' + model);
      const values = cells.map(Number);
      const metrics = Object.fromEntries(Object.keys(parts).map((key, i) => [key, values[i]]));
      return { model, score: values.reduce((a,b) => a+b, 0) / 5, ...(model === 'Kimi-K2.5-Think' ? { setting: 'Thinking' } : {}),
        metrics: { ...metrics, accuracy: parseFloat(accuracy) } };
    }), 10);
  },
} satisfies Leaderboard;
