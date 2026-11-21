// CounterBench tests four types of counterfactual reasoning. Table 3 of version 1 reports accuracy on the original 1,000 questions.
// Tables 2 and 6 break down the four inference strategies by question type. The headline follows Table 3 when rounded values differ.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2502.11008v1';
const parts = { basic:'Basic',conditional:'Conditional',joint:'Joint',nested:'Nested' };
const board: Leaderboard = {
  benchmark:'counterbench', static:'paper', url:feed, feed, parts,
  terms:'The authors publish version 1 under the terms at https://arxiv.org/abs/2502.11008v1.',
  aliases:{'GPT-3 (Davinci-002)':'davinci-002','GPT-4o mini (snapshot unspecified)':'gpt-4o-mini',
    'Claude-3 (Sonnet)':'claude-3-sonnet','Claude-3.5 (Haiku)':'claude-3-5-haiku','Deepseek-V3 (snapshot unspecified)':'deepseek-v3'},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const overall = tables.find(t => t[0]?.join() === 'Model,Standard,CausalCoT,Solver,Ours');
    if (!overall) throw new Error('Missing Table 3');
    return checked(overall.slice(1).flatMap(([model,...scores]) => scores.map((value,i) => {
      const strategy = overall[0][i+1];
      const detail = tables.find(t => t[0]?.length === 11 && t[0].includes(strategy) && t[1]?.[1] === 'Basic');
      if (!detail || !/^\d+(?:\.\d+)?$/.test(value)) throw new Error('Missing scores for '+strategy);
      const row = detail.find(r => r[0] === model || (r[0] === 'GPT-3.5' && model === 'GPT-3.5 turbo'));
      const start = detail[0].indexOf(strategy);
      if (!row || detail[1].slice(start,start+4).join() !== 'Basic,Cond.,Joint,Nested') throw new Error('Missing reasoning types');
      const metrics = Object.fromEntries(Object.keys(parts).map((k,j) => [k,parseFloat(row[start+j])]));
      if (Object.values(metrics).some(v => !Number.isFinite(v))) throw new Error('Invalid category score');
      return {model,score:Number(value), ...(i < 2 ? {setting:strategy} : {harness:strategy === 'Ours' ? 'CoIn' : 'Solver'}), metrics};
    })),40);
  },
};
export default board;
