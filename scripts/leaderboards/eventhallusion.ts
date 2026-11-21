// EventHallusion tests whether video models report events that did not occur.
// Table 1 reports overall binary accuracy and description accuracy. Table 2 adds temporal contrastive decoding.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url='https://arxiv.org/html/2409.16597';
function scores(cells:string[],count:number){
  if(cells.length!==count || cells.some(v=>!/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid EventHallusion results');
  return cells.map(Number);
}
const board:Leaderboard={
  benchmark:'eventhallusion',static:'paper',url,feed:url,terms:PAPER_TERMS,
  parts:{entire:'Entire binary accuracy',mix:'Mix binary accuracy',misleading:'Misleading binary accuracy',
    entireDesc:'Entire description accuracy',mixDesc:'Mix description accuracy',desc:'Overall description accuracy'},
  async fetch(){
    const ts=paperTables(await paperHtml(url)).map(grid);
    const t=ts.find(t=>t[0]?.join('|')==='Models|Entire|Entire|Mix|Mix|Misleading|Overall|Overall' &&
      t[1]?.join('|')==='Models|Binary|Desc.|Binary|Desc.|Binary|Binary|Desc.');
    const decoding=ts.find(t=>t[0]?.join('|')==='Model|Decoding|Entire|Mix|Mis.|Overall');
    if(!t || !decoding) throw new Error('Missing EventHallusion tables');
    const name=(v:string)=>v.split(' (')[0];
    const rows:LeaderboardRow[]=t.slice(2).filter(r=>!r[0].endsWith('-source Models')).map(([raw,...cells])=>{
      const [entire,entireDesc,mix,mixDesc,misleading,score,desc]=scores(cells,7);
      return {model:name(raw),score,setting:'Default',metrics:{entire,entireDesc,mix,mixDesc,misleading,desc}};
    });
    for(const [raw,setting,...cells] of decoding.slice(1)){
      if(setting==='Default') continue;
      const model=({LNV:'LLaVA-NeXT-Video',VC2:'VideoChat2'} as Record<string,string>)[name(raw)]??name(raw);
      const [entire,mix,misleading,score]=scores(cells,4);
      rows.push({model,setting,score,metrics:{entire,mix,misleading}});
    }
    return checked(rows,14);
  },
};
export default board;
