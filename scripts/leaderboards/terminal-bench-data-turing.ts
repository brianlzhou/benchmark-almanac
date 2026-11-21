// Turing measures pass rate over three runs per task with Terminus-2. The benchmark page bundle includes its results table and category breakdown.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const feed = "https://labs.turing.com/assets/index-BZIruKnx.js";

const board: Leaderboard = {
  benchmark: "terminal-bench-data-turing",
  url: "https://labs.turing.com/benchmarks/terminal-bench",
  feed,
  terms: "The publisher gives no reuse license on the benchmark page. https://labs.turing.com/benchmarks/terminal-bench The robots URL returns the application shell.",
  reference: ['Terminus-2'], parts: { 'Scientific Computing':'Scientific Computing', 'Machine Learning':'Machine Learning', 'Data Analysis':'Data Analysis' },
  stats: {
    steps: { name: 'Steps', unit: 'count' },
    toolCalls: { name: 'Tool calls', unit: 'count' },
    wallMinutes: { name: 'Wall time', unit: 'minutes', better: 'lower' },
  },
  async fetch() {
    const body = (await fetchText(feed)).split('slug:"terminal-bench",name:"Terminal-Bench Data"')[1] ?? '';
    const tag = 'kind:"results",rows:';
    const start = body.indexOf(tag);
    if (start < 0) throw new Error('Missing Turing results');
    type Run = {model:string,passRate:string,steps:string,toolCalls:string,wallMin:string,costPerTrial:string};
    const runs = jsLiteral<Run[]>(body, start + tag.length);
    if (runs.length < 3) throw new Error('Missing Turing models');
    const names = ['GPT-5.5','Claude Opus 4.8','Gemini 3.5 Flash'];
    const categories = Object.entries(board.parts!).map(([k]) => {
      const m = body.match(new RegExp(k + ' \\(([\\d.]+) / ([\\d.]+) / ([\\d.]+)\\)'));
      if (!m) throw new Error('Missing domain: ' + k);
      return [k, m.slice(1).map(Number)] as const;
    });
    return runs.map(r => {
      const m = r.passRate.match(/^([\d.]+)% ±([\d.]+)$/);
      if (!m) throw new Error('Missing pass-rate interval');
      const score = Number(m[1]), delta = Number(m[2]), pos = names.indexOf(r.model);
      const metrics: Record<string,number> = { steps:Number(r.steps),toolCalls:Number(r.toolCalls),wallMinutes:Number(r.wallMin) };
      if (pos >= 0) for (const [k,v] of categories) metrics[k] = v[pos];
      const cost = Number(r.costPerTrial.replace('$',''));
      if (![cost,...Object.values(metrics)].every(Number.isFinite)) throw new Error('Invalid Turing run metadata');
      return {model:r.model, score, low:score-delta, high:score+delta, harness:'Terminus-2', trials:3, cost, metrics};
    });
  },
};

export default board;
