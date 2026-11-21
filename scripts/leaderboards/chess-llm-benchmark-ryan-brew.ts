// Ryan Brew ranks chess moves by blunder rate among legal moves. The T2 results CSV supplies rates, intervals and centipawn losses.
import type { Leaderboard } from './types.ts';
import { parseCsv, fetchText } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/rabrew/chess-llm-bench/master/results/metrics/t2_blunder_rate.csv";
const board: Leaderboard = {
  benchmark: 'chess-llm-benchmark-ryan-brew',
  url: "https://github.com/rabrew/chess-llm-bench/blob/master/docs/FINDINGS.md#finding-1-move-quality-is-perfect-or-disaster-and-barely-above-chance",
  feed,
  terms: "The raw file host has no robots.txt. The public repository lists no license for score reuse. https://github.com/rabrew/chess-llm-bench",
  aliases: {
    'phi4:14b': 'phi-4', 'deepseek-r1:7b': 'deepseek-r1-distill-qwen-7b',
    'deepseek-r1:14b': 'deepseek-r1-distill-qwen-14b',
  },
  stats: { legalMoves: { name: 'Legal moves', unit: 'count' }, meanClampedCpl: { name: 'Mean clamped centipawn loss', unit: 'score', better: 'lower' }, medianClampedCpl: { name: 'Median clamped centipawn loss', unit: 'score', better: 'lower' } },
  async fetch() {
    const rows = parseCsv(await fetchText(feed));
    if (rows.length < 22) throw new Error('Missing chess model standings');
    return rows.map(r => {
      const columns = ['n', 'blunder_rate', 'ci_low', 'ci_high', 'mean_cpl_clamped', 'median_cpl_clamped'];
      if (!r.model || columns.some(c => !r[c]?.trim() || !Number.isFinite(Number(r[c]))))
        throw new Error('Incomplete blunder rate row');
      return { model: r.model, score: 100 * Number(r.blunder_rate), low: 100 * Number(r.ci_low), high: 100 * Number(r.ci_high),
        metrics: { legalMoves: Number(r.n), meanClampedCpl: Number(r.mean_cpl_clamped), medianClampedCpl: Number(r.median_cpl_clamped) } };
    });
  },
};
export default board;
