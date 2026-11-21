// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// OPT-BENCH measures iterative optimization on machine learning and NP problems. Tables 1 and 2
// report Expert Gap, the share of the gap from an initial solution to an expert solution closed by OPT-Agent.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2605.08904';
const board: Leaderboard = {
  benchmark: 'opt-bench', static: 'paper', url, feed: url,
  terms: 'The authors publish the tables under the terms at https://arxiv.org/abs/2605.08904.',
  headline: 'The paper reports no overall score, so the headline is the plain mean of Expert Gap on the ML and NP tracks.',
  reference: ['OPT-Agent'],
  parts: { ml: 'OPT-BENCH-ML Expert Gap', np: 'OPT-BENCH-NP Expert Gap' },
  stats: {
    mlWins: { name: 'Machine learning wins', unit: 'count' },
    npWins: { name: 'Nondeterministic polynomial-time wins', unit: 'count' },
    mlImprovementRate: { name: 'Machine learning improvement rate', unit: 'score', better: 'higher', note: 'Stored from the IR(w,w.o) ratio.' },
    npBuggyRate: { name: 'Nondeterministic polynomial-time buggy rate', unit: 'score', better: 'lower', note: 'Stored from 0 to 1.' },
    npBaselineBuggyRate: { name: 'Nondeterministic polynomial-time baseline buggy rate', unit: 'score', better: 'lower', note: 'Stored from 0 to 1.' },
    npBaselineExpertGap: { name: 'Nondeterministic polynomial-time baseline expert gap', unit: 'score', note: 'Stored from 0 to 1.' },
  },
  aliases: { 'gpt-o3-mini': 'o3-mini', 'Qwen3-235B-Thinking': 'qwen3-235b-a22b-thinking-jul-2025',
    'Qwen3-235B-Instruct': 'qwen3-235b-a22b-instruct-jul-2025', 'Internlm3-8b-instruct': 'internlm3-8b' },
  async fetch() {
    const tabs = flatPaperTables(await paperHtml(url)).map(grid);
    const find = (columns: string[], steps: number) => tabs.find(t =>
      t[1]?.join('|') === ['Model', ...Array(3).fill(columns).flat()].join('|') &&
      t[0]?.join('|') === ['Model', ...[5,10,20].flatMap(s => Array(steps).fill(s+' steps'))].join('|'));
    const ml = find(['Win Count','IR(w,w.o)','EG'], 3);
    const np = find(['Win Count','Buggy Rate','Buggy Rate','EG','EG'], 5);
    if (!ml || !np || np[2]?.slice(1).join('|') !== Array(3).fill('Win Count|w|w.o|w|w.o').join('|')) throw new Error('OPT-BENCH results changed');
    return checked(ml.slice(2).filter(r => !r.every(c => c === r[0])).flatMap(([model, ...m]) => {
      const n = np.slice(3).find(r => r[0].toLowerCase() === model.toLowerCase())?.slice(1);
      if (!n || n.length !== 15 || m.length !== 9) throw new Error('Missing OPT-BENCH track for '+model);
      return [5,10,20].map((steps,i) => {
        const ml = numberCell(m[3*i+2]), np = numberCell(n[5*i+3]);
        const wins = (s: string) => {
          if (!/^\d+\/\d+$/.test(s)) throw new Error('Unexpected win count');
          return Number(s.split('/')[0]);
        };
        return { model, setting: steps+' steps', harness: 'OPT-Agent', score: (ml+np)/2, metrics: {
          ml, np, mlWins: wins(m[3*i]), npWins: wins(n[5*i]), mlImprovementRate: numberCell(m[3*i+1]),
          npBuggyRate: numberCell(n[5*i+1]), npBaselineBuggyRate: numberCell(n[5*i+2]), npBaselineExpertGap: numberCell(n[5*i+4]),
        } };
      });
    }), 57);
  },
};
export default board;
