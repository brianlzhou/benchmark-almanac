// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// EHRSQL tests SQL generation and abstention on health records. Table 5 gives test execution F1
// for each database, alongside answerability F1 and execution precision and recall.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url='https://arxiv.org/html/2301.07695';
const databases=['MIMIC-III','eICU'];
const names=['Answerability F1','Execution precision','Execution recall','Execution F1'];
const parts=Object.fromEntries(databases.flatMap((db,i)=>names.map((n,j)=>['db'+i+'m'+j,db+' '+n])));
const board:Leaderboard={
  benchmark:'ehrsql',static:'paper',url,feed:url,terms:PAPER_TERMS,parts,
  headline:'The paper reports no overall test execution F1. The headline averages the values for MIMIC-III and eICU.',
  async fetch(){
    const ts=paperTables(await paperHtml(url)).map(grid).filter(t=>t[0]?.join('|')==='Model|Valid|Valid|Valid|Valid|Test|Test|Test|Test' &&
      t[1]?.join('|')==='Model|F1 ans|P exe|R exe|F1 exe|F1 ans|P exe|R exe|F1 exe');
    if(ts.length!==2) throw new Error('Missing EHRSQL database results');
    const runs=new Map<string,LeaderboardRow>();
    for(const [i,t] of ts.entries()){
      let setting='';
      for(const [model,...cells] of t.slice(2)){
        if(!model && cells[0]?.startsWith('Threshold: ')){setting=cells[0];continue;}
        if(!setting || !model || cells.length!==8 || cells.some(v=>!/^\d+\.\d+$/.test(v))) throw new Error('Invalid EHRSQL row');
        const key=JSON.stringify([model,setting]);
        const row=runs.get(key)??{model,setting,score:0,metrics:{}};
        cells.slice(4).forEach((v,j)=>{row.metrics!['db'+i+'m'+j]=Number(v);});
        runs.set(key,row);
      }
    }
    for(const row of runs.values()) row.score=(row.metrics!.db0m3+row.metrics!.db1m3)/2;
    return checked([...runs.values()],6);
  },
};
export default board;
