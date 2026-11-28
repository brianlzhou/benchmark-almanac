// RealBench tests Verilog generation on real-world IP designs.
// Table III reports module-level syntax, functional and formal verification pass rates for ten named models.
// The headline is formal@1 because formal verification is the benchmark's strict correctness check.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2507.16200';
const board: Leaderboard = {
  benchmark: 'realbench-verilog', static: 'paper', url: 'https://arxiv.org/abs/2507.16200', feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2507.16200',
  parts: { syntaxAt1: 'Syntax pass@1', syntaxAt5: 'Syntax pass@5', funcAt1: 'Functional pass@1', funcAt5: 'Functional pass@5', formalAt1: 'Formal pass@1', formalAt5: 'Formal pass@5' },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    if (!text.includes('RealBench-\n                    func@1')) throw new Error('RealBench module table missing');
    const values: Array<[string, number, number | null, number, number | null, number | null, number | null, number, number, number, number]> = [
      ['GPT-4-Turbo', 27.0, 36.2, 9.4, 13.8, 4.4, 6.8, 0, 0, 0, 0],
      ['o1-preview', 28.3, null, 13.3, null, 13.3, null, 0, 0, 0, 0],
      ['Llama-3.1-8B', 10.3, 21.7, 2.9, 6.2, 2.6, 4.7, 0, 0, 0, 0],
      ['Llama-3.1-405B', 6.6, 15.7, 2.8, 7.6, 2.6, 6.9, 0, 0, 0, 0],
      ['DeepSeek-V3-671B', 24.9, 32.0, 12.8, 17.3, 10.8, 14.2, 0, 0, 0, 0],
      ['DeepSeek-R1-671B', 13.4, 30.4, 8.0, 16.2, 7.8, 15.4, 0, 0, 0, 0],
      ['RTLCoder-DS-6.7B', 10.9, 19.0, 3.4, 8.5, 2.0, 3.6, 0, 0, 0, 0],
      ['QW-7B', 3.6, 7.4, 0.3, 1.0, 0.0, 0.0, 0, 0, 0, 0],
      ['GPT-4o', 24.5, 29.7, 10.9, 14.0, 8.8, 12.4, 0, 0, 0, 0],
      ['GPT-4o-V', 29.3, 38.1, 13.5, 16.2, 11.7, 13.3, 0, 0, 0, 0],
    ];
    const rows = values.map(([model, syntaxAt1, syntaxAt5, funcAt1, funcAt5, formalAt1, formalAt5]) => ({
      model, setting: 'module-level', score: formalAt1 as number, metrics: { syntaxAt1, ...(syntaxAt5 == null ? {} : { syntaxAt5 }), funcAt1, ...(funcAt5 == null ? {} : { funcAt5 }), formalAt1: formalAt1 as number, ...(formalAt5 == null ? {} : { formalAt5 }) },
    }));
    return checked(rows, 10);
  },
};
export default board;
