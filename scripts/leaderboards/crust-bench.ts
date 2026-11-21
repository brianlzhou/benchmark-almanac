// CRUST-bench measures whether C projects translated to safe Rust pass their tests.
// Table 4 reports build and test pass rates for single-shot translation and repair.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const url = 'https://arxiv.org/html/2504.15254';
const settings = ['Single-shot', 'Compiler repair (3 rounds)', 'Test repair (3 rounds)'];

const board: Leaderboard = {
  benchmark: 'crust-bench', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  aliases: {'Claude 3.7':'claude-3-7-sonnet', 'Qwen-2.5-Coder-32B':'qwen2-5-coder-32b-instruct'},
  parts: {build: {name: 'Build', unit: '%'}},
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t =>
      t[0]?.join('|') === 'Model|Pass@1|Pass@1|Pass@1 + Compiler|Pass@1 + Compiler|Pass@1 + Test repair|Pass@1 + Test repair' &&
      t[2]?.join('|') === '|Build|Test|Build|Test|Build|Test');
    if (!table) throw new Error('Missing CRUST-bench pass rates');
    const rows: LeaderboardRow[] = [];
    for (const [label, ...cells] of table.slice(3)) {
      if (label === '[1pt/2pt]' && cells.every(v => !v)) continue;
      const agent = label === 'Adapted SWE-agent (Claude-3.7)';
      for (const [i, setting] of settings.entries()) {
        const [build, test] = cells.slice(i * 2, i * 2 + 2);
        if (build === '–' && test === '–') continue;
        if (![build, test].every(v => /^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid pass rate for ' + label);
        rows.push({model: agent ? 'Claude 3.7' : label, ...(agent ? {harness:'Adapted SWE-agent'} : {setting}),
          score: Number(test), metrics: {build:Number(build)}});
      }
    }
    return checked(rows, 37);
  },
};
export default board;

