// AssertLLM2 tests hardware assertion generation. Table 4 reports syntax validity first, followed
// by formal verification counts, coverage and mutation-based bug detection. The authors report no composite.
// Average evaluates three generated sets separately. Union evaluates their merged assertions.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url='https://arxiv.org/html/2605.27472';
const board:Leaderboard={
  benchmark:'assertllm2',static:'paper',url,feed:url,terms:PAPER_TERMS,
  headline:'The paper reports no overall score, so this is the percentage of syntactically valid assertions, its first metric.',
  parts:{syntax:{name:'Syntax',unit:'%'},proven:{name:'Proven assertions',unit:'score'},total:{name:'Syntactically correct assertions',unit:'score'},
    coi:{name:'COI coverage',unit:'%'},proof:{name:'Proof coverage',unit:'%'},formal:{name:'Formal coverage',unit:'%'},kill:{name:'Bug kill ratio',unit:'%'}},
  async fetch(){
    const t=paperTables(await paperHtml(url)).map(grid).find(t=>t[1]?.join('|')==='|Model|Syntax (%)|FPV (P/T)|COI|Proof|Formal|Bug Kill Ratio');
    if(!t) throw new Error('Missing Table 4');
    const rows=t.slice(2).map(([setting,model,syntax,fpv,coi,proof,formal,kill])=>{
      const counts=fpv.match(/^(\d+)\/(\d+)$/);
      if(!counts || !['Average','Union'].includes(setting)) throw new Error('Unknown FPV result or setting');
      const metrics={syntax:Number(syntax),proven:Number(counts[1]),total:Number(counts[2]),coi:Number(coi),proof:Number(proof),formal:Number(formal),kill:Number(kill)};
      if(!Object.values(metrics).every(Number.isFinite)) throw new Error('Missing model score');
      return {model,setting,score:metrics.syntax,trials:3,metrics};
    });
    return checked(rows,12);
  },
};
export default board;
