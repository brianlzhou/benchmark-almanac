// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// EgoProceL tests recognition of procedural steps in first-person videos. Table 3 reports F1 and IoU by video group.
import type { Leaderboard } from './types.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const url='https://arxiv.org/html/2207.10883';
const groups=['CMU-MMAC','EGTEA G.','MECCANO','EPIC-Tents','PC Assembly','PC Disas.'];
const parts=Object.fromEntries(groups.flatMap((g,i)=>[['f'+i,g+' F1'],['iou'+i,g+' IoU']]));
const board:Leaderboard={
  benchmark:'egoprocel',static:'paper',url,feed:url,terms:PAPER_TERMS,parts,
  headline:'The paper reports no overall score. The headline averages F1 across its six video groups.',
  async fetch(){
    const table=inlinePaperTables(await paperHtml(url)).find(t=>t[1]?.slice(1).join('|')===groups.flatMap(g=>[g,g]).join('|') &&
      t[2]?.slice(1).join('|')===Array(groups.length).fill('F1|IoU').join('|'));
    if(!table) throw new Error('Missing EgoProceL procedure learning results');
    const rows=table.slice(3).filter(r=>r[0]!=='Random').map(([model,...cells])=>{
      if(cells.length!==groups.length*2 || cells.some(v=>!/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid score for '+model);
      const metrics=Object.fromEntries(Object.keys(parts).map((k,i)=>[k,Number(cells[i])]));
      const score=groups.reduce((s,_,i)=>s+metrics['f'+i],0)/groups.length;
      return {model,score,metrics};
    });
    return checked(rows,3);
  },
};
export default board;
