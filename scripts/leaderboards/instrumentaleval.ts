// InstrumentalEval measures how often models pursue instrumental goals in hypothetical scenarios.
// Table 1 reports the total rate and six category rates. Table 3 repeats two models without goal nudging.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml,PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables,grid,checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2502.12206';
const board:Leaderboard={
  benchmark:'instrumentaleval',static:'paper',feed,url:feed,terms:PAPER_TERMS+' https://arxiv.org/licenses/',
  stats:{Total:{name:'Overall instrumental goal rate',unit:'%',better:'lower'}},
  async fetch(){
    const gs=paperTables(await paperHtml(feed)).map(grid);
    const main=gs.find(t=>t[0]?.includes('Gemini 2.0 FTE.') && t.at(-1)?.[0]==='Total');
    const ablation=gs.find(t=>t[1]?.join('|')==='Behavior Category|Without|With|Gap|Without|With|Gap');
    if(!main || !ablation) throw Error('Missing convergence or goal-nudging table');
    board.parts=Object.fromEntries(main.slice(1,-1).map(r=>[r[0],r[0]]));
    const rows:LeaderboardRow[]=[];
    function add(table:string[][],start:number,column:number,setting:string){
      const metrics:Record<string,number>={};
      for(const cells of table.slice(start)){
        if(!cells[column]?.trim() || !Number.isFinite(Number(cells[column]))) throw Error('Missing '+cells[0]);
        metrics[cells[0]]=Number(cells[column]);
      }
      rows.push({model:table[0][column],score:metrics.Total,setting,metrics});
    }
    for(let i=1;i<main[0].length;i++) add(main,1,i,'With goal nudging');
    for(let i=1;i<ablation[0].length;i++) if(ablation[1][i]==='Without') add(ablation,2,i,'Without goal nudging');
    return checked(rows,10);
  },
};
export default board;
