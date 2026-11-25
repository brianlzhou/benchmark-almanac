// HEPToolBench measures how many particle physics tasks each deployment passes. Its corrected figure CSV includes pass fractions and confidence intervals.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/AadarshSingh0/HEPToolBench/main/local_llm_benchmark/results/heptoolbench_v1_2_1_correction/paper_a/figure_data/fig1_leaderboard.csv";

const board: Leaderboard = {
  benchmark: "heptoolbench-1-2",
  url: "https://github.com/AadarshSingh0/HEPToolBench/blob/main/local_llm_benchmark/results/heptoolbench_v1_2_1_correction/paper_a/figure_data/fig1_leaderboard.csv",
  feed: FEED,
  terms: "The repository uses BSD 3-Clause. The file contains 42 deployments of 41 named models. https://github.com/AadarshSingh0/HEPToolBench/blob/main/LICENSE GitHub requests a one-second crawl delay.",
  stats: {
    passes: { name: 'Tasks passed', unit: 'count' },
    meanScore: { name: 'Mean score', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const rows = parseCsv(await fetchText(FEED));
    if (rows.length < 42) throw new Error('Expected 42 scored deployments');
    return rows.map(r => {
      const required = ['tasks', 'passes', 'mean_score', 'pass_fraction', 'ci_lo', 'ci_hi'];
      if (!r.display || !r.deployment || !required.every(k => r[k]?.trim() && Number.isFinite(Number(r[k])))) throw new Error('Incomplete HEPToolBench result');
      return { model: r.display, setting: [r.provider, r.deployment].filter(Boolean).join(' / '), score: Number(r.pass_fraction) * 100,
        low: Number(r.ci_lo) * 100, high: Number(r.ci_hi) * 100, params: r.total_b ? Number(r.total_b) : undefined,
        open: r.weights === 'open', metrics: { passes: Number(r.passes), meanScore: Number(r.mean_score) } };
    });
  },
};
export default board;
