// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// FEABench tests simulation code. Tables 3 and 4 report interface factuality first on both Gold
// and Large. Keep each set's reported physics metrics and standard errors. Table 2 adds code metrics on Gold.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url='https://arxiv.org/html/2504.06260';
const keys=['interfaceFactuality','interfaceRecall','featureRecall','propertyRecall','dimension'];
const labels=['Interface Factuality','Interface Recall','Feature Recall','Feature Property Recall','Feature Dimension'];
const parts=Object.fromEntries(['Gold','Large'].flatMap(db=>keys.map((k,i)=>[db+k,db+' '+labels[i]])));
function measurement(cell:string){
  const m=cell.match(/^(\d+\.\d+)\s*\\pm\s*(\d+\.\d+)$/);
  if(!m) throw new Error('Invalid FEABench mean and standard error: '+cell);
  return m.slice(1).map(v=>Number(v)*100);
}
const board:Leaderboard={
  benchmark:'feabench',static:'paper',url,feed:url,terms:PAPER_TERMS,parts,
  headline:'The headline averages interface factuality on Gold and Large. This is the first physics metric the paper reports for both sets.',
  async fetch(){
    const ts=paperTables(await paperHtml(url)).map(grid);
    const gold=ts.find(t=>t[0]?.join('|')===['Experiment',...labels].join('|'));
    const large=ts.find(t=>t[0]?.join('|')===['Experiment',...labels.slice(0,4),'Feature Dim.'].join('|'));
    const code=ts.find(t=>t[0]?.join('|')==='Experiment|Executability|Model Tree Score|Valid Target');
    if(!gold || !large || !code) throw new Error('Missing FEABench comparisons');
    const rows=large.slice(1).map(([model,...largeCells])=>{
      const g=gold.find(r=>r[0]===model),c=code.find(r=>r[0]===model);
      if(!g || !c) throw new Error('Missing Gold results for '+model);
      const metrics:Record<string,number>={};
      for(const [db,cells] of [['Gold',g.slice(1)],['Large',largeCells]] as const){
        keys.forEach((k,i)=>{[metrics[db+k],metrics[db+k+'Stderr']]=measurement(cells[i]);});
      }
      [metrics.executability,metrics.executabilityStderr]=measurement(c[1]);
      [metrics.modelTree,metrics.modelTreeStderr]=measurement(c[2]);
      const valid=c[3].match(/^(\d+)\s*\/\s*15$/);
      if(!valid) throw new Error('Missing valid target count');
      metrics.validTargets=Number(valid[1]);
      return {model,score:(metrics.GoldinterfaceFactuality+metrics.LargeinterfaceFactuality)/2,metrics};
    });
    return checked(rows,3);
  },
};
export default board;
