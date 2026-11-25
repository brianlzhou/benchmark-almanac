// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// ASPI evaluates agent safety. Table 2 gives attack success for six conditions. Clarification rates use only
// scenarios in which the agent asked for clarification. Tables 1 and 4 to 6 add utility, suites and defenses.
import type { Leaderboard,LeaderboardRow } from './types.ts';
import { paperHtml,PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { grid,flatPaperTables,checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2605.17324';
const conditions=['exec_tool','exec_user','exec_next','clarif_tool','clarif_ask_user','clarif_user'];
const utility=['U_benign','U_tool','U_user','U_next','U_clBen','U_clTool','U_clAsk','U_clUser'];
const suites=['workspace','slack','travel','banking'];
const parts:NonNullable<Leaderboard['parts']>={};
for (const k of conditions) parts[k]={name:k,unit:'%',better:'lower'};
for (const k of utility) parts[k]={name:'Utility: '+k,unit:'%',better:'higher'};
for (const channel of ['Tool','User']) for(const state of ['Execution','Clarification']) for(const suite of suites){
  const k=channel+' '+state+' '+suite;
  parts[k]={name:k,unit:'%',better:'lower'};
}
function readCell(s:string) {
  const m=s.match(/^(\d+(?:\.\d+)?)(?:% \(\\pm([\d.]+)\))?$/);
  if(!m) throw new Error('Invalid condition score: '+s);
  return {value:Number(m[1]),margin:m[2]===undefined?undefined:Number(m[2])};
}
const board:Leaderboard={
  benchmark:'aspi-scale',url:feed,feed,static:'paper',terms:PAPER_TERMS,parts,
  headline:'The headline averages attack success across six conditions, giving each condition equal weight.',
  stats: {
    clarificationRate: { name: 'Clarification rate', unit: '%', note: 'Percentage of task groups in which the agent invokes ask_user.' },
  },
  aliases:{'Opus 4.7':'claude-opus-4-7','Qwen3-235B':'qwen3-235b-a22b-instruct-jul-2025'},
  async fetch(){
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const main=ts.find(t=>t[0].join('|')===['Model','Clarif. rate',...conditions].join('|'));
    const u=ts.find(t=>t[0].join('|')===['Model',...utility].join('|'));
    const def=ts.find(t=>t[0].join('|')==='Model|Defense|Exec Tool|Exec User|Exec Next|Clarif Tool|Clarif Ask-User|Clarif User');
    const du=ts.find(t=>t[0].join('|')==='Model|Defense|Exec Benign|Exec Tool|Exec User|Exec Next|Clarif Benign|Clarif Tool|Clarif Ask-User|Clarif User');
    const suite=ts.find(t=>t[1]?.join('|')===['Model',...suites,...suites].join('|'));
    if(!main || !u || !def || !du || !suite) throw new Error('Missing ASPI result columns');
    const rows:LeaderboardRow[]=[];
    function add(model:string,setting:string,values:string[],utilityCells:string[]){
      if(values.length!==6 || utilityCells.length!==8) throw new Error('Incomplete ASPI results');
      const metrics:Record<string,number>={};
      [...conditions,...utility].forEach((k,i)=>{
        const cell=readCell(i<6?values[i]:utilityCells[i-6]);metrics[k]=cell.value;
        if(cell.margin!==undefined) metrics[k+'Ci']=cell.margin;
      });
      rows.push({model,setting,metrics,score:conditions.reduce((s,k)=>s+metrics[k],0)/6});
    }
    for(const [model,clarification,...values] of main.slice(1)){
      const ur=u.find(r=>r[0]===model);
      if(!ur) throw new Error('Missing utility for '+model);
      add(model,'No defense',values,ur.slice(1));
      rows.at(-1)!.metrics!.clarificationRate=readCell(clarification).value;
    }
    let channel='';
    for(const [model,...values] of suite.slice(2)){
      if(values[0]===model){channel=model.split('-')[0];continue;}
      const row=rows.find(r=>r.model===model);
      if(!row || !['Tool','User'].includes(channel)) throw new Error('Unrecognized suite row');
      values.forEach((v,i)=>{
        if(v==='–'||v==='-'||v==='—') return;
        row.metrics![channel+' '+(i<4?'Execution':'Clarification')+' '+suites[i%4]]=readCell(v).value;
      });
    }
    for(const [model,setting,...values] of def.slice(1)){
      const ur=du.find(r=>r[0]===model && r[1]===setting);
      if(!ur) throw new Error('Missing defense utility');
      if(setting!=='No defense') add(model,setting,values,ur.slice(2));
      else {
        const row=rows.find(r=>r.model===model)!;
        [...values,...ur.slice(2)].forEach((v,i)=>{ row.metrics![[...conditions,...utility][i]+'Ci']=readCell(v).margin!; });
      }
    }
    return checked(rows,14);
  },
};
export default board;
