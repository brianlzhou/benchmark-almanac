// FEM-Bench reports how many of 33 functions match their reference outputs on the first run.
// The README also gives generated-test success for the same tasks and five-run totals for three models.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/elejeune11/FEM-bench/main/README.md";
const board: Leaderboard = {
  benchmark: 'fem-bench',
  url: "https://github.com/elejeune11/FEM-bench#results",
  feed,
  terms: "The raw file host has no robots.txt. The authors publish the score tables in the MIT licensed repository. https://github.com/elejeune11/FEM-bench/blob/main/LICENSE",
  stats: {
    jointTestSuccess: { name: 'Joint test success rate', unit: '%', better: 'higher', note: 'Percentage of generated tests that pass the reference and fail all known-broken implementations.' },
    anyOfFive: { name: 'Tasks solved with any success', unit: '%', better: 'higher' },
    allFive: { name: 'Tasks solved with five of five success', unit: '%', better: 'higher' },
  },
  async fetch() {
    const source = await fetchText(feed);
    const tables = markdownTables(source);
    const fn = tables.find(t=>t.at(-1)?.[0]==='Total' && t[0][0]==='Task');
    const tests = tables.find(t=>t.at(-1)?.[0]==='Avg Joint Success %');
    const repeated = tables.find(t=>t.at(-1)?.[0]==='Tasks Solved (5/5 success)');
    if (!fn || !tests || !repeated || fn[0].length < 11 || fn[0].join() !== tests[0].join()) throw new Error('Missing FEM results tables');
    const ratio = (s: string) => {
      const m = s?.match(/^(\d+)\/(\d+)$/);
      if (!m || Number(m[2]) !== 33) throw new Error('Invalid FEM total');
      return 100 * Number(m[1]) / Number(m[2]);
    };
    const fraction = (s: string) => {
      if (!/^\d+(\.\d+)?%$/.test(s)) throw new Error('Invalid FEM percentage');
      return parseFloat(s);
    };
    const repeatNames: Record<string,string> = { 'gemini-3-pro-preview':'Gemini 3 Pro (Preview)', 'claude-opus-4.5':'Claude Opus 4.5', 'gpt-5':'GPT 5' };
    board.parts = {};
    return fn[0].slice(1).map((model,index) => {
      const c = index+1, metrics: Record<string,number> = { jointTestSuccess: fraction(tests.at(-1)![c]) };
      const tasks = fn.slice(1,-1).filter(r=>r[c] === '✓' || r[c] === '×');
      if (tasks.length !== 33) throw new Error('Expected 33 FEM tasks for ' + model);
      for (const [i,row] of tasks.entries()) {
        const k = 'function' + (i+1);
        metrics[k] = row[c] === '✓' ? 100 : 0;
        board.parts![k] = { name: row[0], group: 'Function correctness' };
        const test = tests.find(r=>r[0] === row[0])?.[c];
        if (test !== '–') {
          const tk = 'test' + (i+1);
          metrics[tk] = fraction(test ?? '');
          board.parts![tk] = { name: row[0], group: 'Joint test success' };
        }
      }
      const rc = repeated[0].indexOf(repeatNames[model]);
      if (rc > 0) {
        metrics.anyOfFive = ratio(repeated.at(-2)![rc]);
        metrics.allFive = ratio(repeated.at(-1)![rc]);
      }
      return { model, setting: 'First run', score: ratio(fn.at(-1)![c]), metrics };
    });
  },
};
export default board;
