// AutoBench tests whether generated Verilog testbenches detect faulty implementations.
// Figure 7 of the authors' CorrectBench paper plots the percentage passing Eval2 across 156 tasks.
// Each colored SVG path contains three bars. Their cumulative widths also give Eval1 and Eval0.
// We read the vector coordinates to the nearest tenth of a percentage point.
import { createHash } from 'node:crypto';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard } from './types.ts';

const url = 'https://arxiv.org/html/2411.08510v1';
const feed = url + '/LLMs_comparison_bars.svg';
const models = ['gpt-4o-2024-08-06', 'claude-3-5-sonnet-20240620', 'gpt-4o-mini-2024-07-18'];
const methods = ['CorrectBench', 'AutoBench', 'Baseline'];

const board: Leaderboard = {
  benchmark: 'autobench-testbench', static: 'paper', url, feed,
  terms: 'The authors publish Figure 7 at https://arxiv.org/abs/2411.08510 under the license listed there.',
  headline: 'Eval2 pass rates are read from Figure 7 to the nearest tenth of a percentage point.',
  parts: { eval1: 'Eval1', eval0: 'Eval0' },
  aliases: { 'gpt-4o-2024-08-06': 'gpt-4o-aug-2024', 'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet', 'gpt-4o-mini-2024-07-18': 'gpt-4o-mini' },
  async fetch() {
    const svg = await paperHtml(feed);
    if (createHash('sha256').update(svg).digest('hex') !== '59d8e0ddcd205b64d2b3ed68cc248f81a4ac8e4240d25df14c90e7421f330760') {
      throw new Error('Figure 7 changed');
    }
    function bars(color: string) {
      const panels = [...svg.matchAll(/<path d="([^"]+)" fill="(#[0-9a-f]+)"/g)]
        .filter(([,path,fill]) => fill === color && path.includes('V72.512M'))
        .map(([,path]) => [...path.matchAll(/M([\d.]+) [\d.]+H([\d.]+)/g)].map(([,left,right]) => Number(right) - Number(left)));
      if (panels.length !== models.length || panels.some(panel => panel.length !== methods.length)) throw new Error('Missing Figure 7 bars');
      return panels;
    }
    const full = bars('#ee7c79'), eval0 = bars('#f8ac8c'), eval1 = bars('#aaffff'), eval2 = bars('#4489c8');
    return checked(models.flatMap((model,i) => methods.map((method,j) => {
      const percent = (width: number) => Math.round(width * 1000 / full[i][j]) / 10;
      return { model, harness: method, score: percent(eval2[i][j]), metrics: { eval1: percent(eval1[i][j]), eval0: percent(eval0[i][j]) },
        trials: i === 1 && j === 0 ? 1 : i === 1 ? undefined : 5 };
    })), 9);
  },
};
export default board;
