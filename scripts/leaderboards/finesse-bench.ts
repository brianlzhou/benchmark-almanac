// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// FINESSE-Bench evaluates financial question answering, professional exams and trading or technical analysis.
// Read the published group scores, individual dataset scores and their bootstrap intervals from the leaderboard data file.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';
const feed='https://limexailab.github.io/QuantCode-Bench/finesse-bench/data.js?v=20260706';
const groups={public:'Public benchmarks',exam:'Exam-like',trading:'Trading / TA'};
const datasetNames=['FinQA','ConvFinQA','TAT-QA','CFA-like Level 1','CFA-like Level 2','CFA-like Level 3','CMT-like Level 2','VLigaBench-ru','Trading_derivatives','Trading_TA','CFTe-like Level 1'];
function records<T>(js:string, name:string):T {
  const literal=js.split('const '+name+' = ')[1]?.split(';')[0];
  if (!literal?.startsWith('[')) throw new Error('Missing '+name);
  return JSON.parse(literal.replace(/'([^'\\]*)'/g,(_,s:string)=>JSON.stringify(s)));
}
const board:Leaderboard={
  benchmark:'finesse-bench',url:'https://limexailab.github.io/QuantCode-Bench/finesse-bench/#leaderboard',feed,
  terms:'The project lists Apache 2.0 for code and CC BY-NC 4.0 for datasets at https://github.com/LimexAILab/FINESSE-Bench#license.',
  aliases:{'Mistral-Small-3.2-24B-Instruct-2506':'mistral-small-3-2'},
  parts:{...groups,...Object.fromEntries(datasetNames.map(n=>[n.replace(/\W/g,'_'),n]))},
  async fetch(){
    const js=await fetchText(feed);
    const data=records<{model:string,metrics:Record<string,number>}[]>(js,'MODEL_DATA');
    const intervals=Object.assign({},...records<Record<string,Record<string,{low:number,high:number}>>[]>(js,'CI_DATA'));
    const rows:LeaderboardRow[]=[];
    for(const entry of data){
      const values=Object.keys(groups).map(g=>entry.metrics[g]);
      if(values.some(v=>v===undefined))continue;
      const metrics:Record<string,number>={};
      for(const [name,value] of Object.entries(entry.metrics)){
        const key=name.replace(/\W/g,'_');
        if(!Number.isFinite(value) || !(key in board.parts!))throw new Error('Unexpected score '+name);
        metrics[key]=value;
        const ci=intervals[entry.model]?.[name];
        if(ci){
          if(!Number.isFinite(ci.low)||!Number.isFinite(ci.high))throw new Error('Invalid interval');
          metrics[key+'Low']=ci.low;metrics[key+'High']=ci.high;
        }
      }
      const split=entry.model.match(/^(.+?)\s+(think|nothink)$/i);
      rows.push({model:split?.[1]??entry.model,setting:split?.[2],score:values.reduce((a,b)=>a+b,0)/3,metrics});
    }
    return checked(rows,45);
  },
};
export default board;
