// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// FVEval tests models that write assertions for hardware formal verification. Tables 1, 3 and 5 report functional correctness.
// Use zero-shot NL2SVA scores and Design2SVA pass@1 scores, keeping only models present in every part.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2410.23299';
const names = ['NL2SVA-Human', 'NL2SVA-Machine', 'Design2SVA Pipeline', 'Design2SVA FSM'];
const board: Leaderboard = {
  benchmark: 'fveval', static: 'paper', feed, url: feed,
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The paper gives no overall score. The headline averages functional correctness across four parts, giving each equal weight.',
  parts: Object.fromEntries(names.map(name => [name, name])),
  async fetch() {
    const grids = paperTables(await paperHtml(feed)).map(grid);
    const human = grids.find(t => t[0]?.join('|') === 'Model|Syntax|Func.|Partial Func.|BLEU');
    const machine = grids.find(t => t[0]?.[1] === '0-shot' && t[1]?.[2] === 'Func.');
    const design = grids.find(t => t[0]?.[1] === 'Pipeline' && t[0]?.[5] === 'FSM' && t[1]?.[3] === 'Func.@1' && t[1]?.[7] === 'Func.@1');
    if (!human || !machine || !design) throw Error('Missing functional correctness tables');
    const rows = design.slice(2).map(r => {
      const model = r[0];
      const values = [human.find(c => c[0] === model)?.[2], machine.find(c => c[0] === model)?.[2], r[3], r[7]]
        .map(s => s?.trim() ? Number(s) * 100 : NaN);
      if (!values.every(Number.isFinite)) throw Error('Missing functional correctness for ' + model);
      return { model, score: values.reduce((a,b) => a+b,0)/4,
        metrics: Object.fromEntries(names.map((name,i) => [name, values[i]])) };
    });
    return checked(rows,6);
  },
};
export default board;
