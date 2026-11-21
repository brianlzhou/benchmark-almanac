// DRBench tests enterprise research agents. Table 21 expands Table 3 to nine backbones.
// Its headline is the published harmonic mean of the four report quality measures.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const url='https://arxiv.org/html/2510.00172';
const parts={recall:'Insight Recall',factuality:'Factuality',avoidance:'Distractor Avoidance',quality:'Report Quality'};
const board: Leaderboard = {
  benchmark:'drbench',static:'paper',url,feed:url,terms:PAPER_TERMS,parts,
  async fetch() {
    const table=paperTables(await paperHtml(url)).map(grid).find(t=>t[0]?.join('|')===
      ['Model','Planning',...Object.values(parts),'Harmonic Mean'].join('|'));
    if(!table) throw new Error('Missing full DRBench model and planning comparison');
    const rows=table.slice(1).map(([model,plan,...values])=>{
      if(values.length!==5 || values.some(v=>!/^\d+(\.\d+)?$/.test(v))) throw new Error('Invalid DRBench result');
      const setting=({None:'No planning',SRP:'Simple research planning',CRP:'Complex research planning'} as Record<string,string>)[plan];
      if(!setting) throw new Error('Unknown planning setting '+plan);
      const [recall,factuality,avoidance,quality,score]=values.map(Number);
      return {model,setting,harness:'DRBA',score,metrics:{recall,factuality,avoidance,quality}};
    });
    return checked(rows,27);
  },
};
export default board;
