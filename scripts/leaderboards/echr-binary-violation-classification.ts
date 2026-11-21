// This ECHR task predicts whether a court case involved a human rights violation.
// Table 2 gives macro F1, precision and recall, with standard deviations over five runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const url='https://arxiv.org/html/1906.02059';
const board: Leaderboard = {
  benchmark:'echr-binary-violation-classification',static:'paper',url,feed:url,terms:PAPER_TERMS,
  parts:{precision:'Macro precision',recall:'Macro recall'},
  async fetch() {
    const t=paperTables(await paperHtml(url)).map(grid).find(t=>t[0]?.join('|')==='|P|R|F1' && t.some(r=>r[0]==='Non-Anonymized'));
    if(!t) throw new Error('Missing binary violation results');
    let setting='';
    const rows:LeaderboardRow[]=[];
    for(const [model,...cells] of t.slice(1)){
      if(model==='majority' || model==='coin-toss') continue;
      if(['Non-Anonymized','Anonymized'].includes(model)){setting=model;continue;}
      if(!setting || cells.length!==3) throw new Error('Invalid ECHR result');
      const [[precision,precisionStd],[recall,recallStd],[score,std]]=cells.map(cell=>{
        const m=cell.match(/^(\d+\.\d+)\s*\\pm\s*(\d+\.\d+)$/);
        if(!m) throw new Error('Missing ECHR mean or standard deviation');
        return m.slice(1).map(Number);
      });
      rows.push({model,setting,score,trials:5,metrics:{std,precision,precisionStd,recall,recallStd}});
    }
    return checked(rows,10);
  },
};
export default board;
