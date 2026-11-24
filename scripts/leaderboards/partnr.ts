// PARTNR evaluates embodied collaborative planning. Table 11 reports test-set
// success rates, task completion, simulation steps and planning cycles with standard errors.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2411.00081';
const board: Leaderboard = {
  benchmark:'partnr',static:'paper',url,feed:url,harnesses:'system',
  terms:'The authors publish the paper under the license linked at https://arxiv.org/abs/2411.00081.',
  stats:{steps:{name:'Simulation steps',unit:'count',better:'lower'},stepSE:{name:'Simulation steps standard error',unit:'count'},
    complete:{name:'Completion rate',unit:'%',better:'higher'},
    completeSE:{name:'Completion rate standard error',unit:'%'},cycles:{name:'Planning cycles',unit:'count',better:'lower'},
    cycleSE:{name:'Planning cycles standard error',unit:'count'}},
  async fetch() {
    const html = await paperHtml(url);
    const figure = [...html.matchAll(/<figure\b[^>]*class="ltx_table"[^>]*>[\s\S]*?<\/figure>/g)]
      .find(f=>f[0].includes('Table 11</span>'));
    const t = figure && flatPaperTables(figure[0]).map(grid)[0];
    if (!t || !t[0].join('|').match(/Method\|Controllability\|Skills\|Observability\|Sim Steps.*Success Rate.*Completion Rate.*Planning Cycles/))
      throw new Error('PARTNR test table missing');
    return checked(t.slice(1).filter(r=>r[0]!=='Heuristic-Expert').map(r=>{
      const [harness,control,skills,obs,...cells] = r;
      const [[steps,stepSE],[success,se],[complete,completeSE],[cycles,cycleSE]] = cells.map(c=>{
        const m = c.match(/^([\d.]+) \\pm ([\d.]+)$/);
        if (!m) throw new Error('Missing estimate or standard error');
        return [Number(m[1]),Number(m[2])];
      });
      const partner = 'Llama3.1-70B-Instruct';
      const model = harness==='Finetuned'?'Finetuned Llama3.1-8B':harness==='ReAct-8B'?'Llama-3.1-8B-Instruct':partner;
      return {model,harness,setting:[control,skills+' skills',obs+' observability'].join(', '),
        ...(model===partner?{}:{models:[model,partner]}),score:100*success,
        metrics:{steps,stepSE,stderr:100*se,complete:100*complete,completeSE:100*completeSE,cycles,cycleSE}};
    }),10);
  },
};
export default board;
