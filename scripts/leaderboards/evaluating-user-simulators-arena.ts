// This benchmark evaluates user simulators for interactive agents.
// Table 4 reports a geometric-mean headline over ranking agreement and two fidelity levels.
// The three component scores remain metrics for each simulator.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2611.24892';
const board: Leaderboard = {
  benchmark: 'evaluating-user-simulators-arena', static: 'paper',
  url: 'https://arxiv.org/abs/2611.24892', feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2611.24892',
  parts: { l1: 'L1: Ranking agreement', l2: 'L2: Population fidelity', l3: 'L3: Trace fidelity' },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    if (!text.includes('Table 4: Six user simulators evaluated with the evaluation suite')) throw new Error('User simulator Table 4 missing');
    const values: Array<[string, number, number, number, number]> = [
      ['Ours, Sonnet 5 backbone', 47, 87, 83, 70],
      ['SimulatorArena (gpt-5-mini)', 57, 79, 74, 69],
      ['Ours, Terra backbone', 42, 73, 84, 64],
      ['Ours, Luna backbone', 40, 72, 78, 61],
      ['τ2-bench (gpt-4.1)', 33, 82, 74, 59],
      ['MIMESIS-9B', 27, 82, 61, 51],
    ];
    const rows = values.map(([model, l1, l2, l3, score]) => ({ model, score, metrics: { l1, l2, l3 } }));
    return checked(rows, 6);
  },
};
export default board;
