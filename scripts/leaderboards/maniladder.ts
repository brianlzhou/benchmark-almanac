// ManiLadder evaluates robot manipulation. The board defines Attained Level as "the highest level a policy attains together with every level below it."
// AL@50 counts consecutive levels where at least 80% of all tasks reach a 50% success rate. Unevaluated tasks do not meet the threshold.
// Read the leaderboard's published per-task success rates over 50 test episodes and reproduce its two attainment thresholds.
import type { BoardPart, Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { jsonAfter } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
const feed='https://maniladder-benchmark.github.io/data/leaderboard.js';
interface Data {al:{rho:number,taus:number[]};models:{name:string,variant:string}[];tasks:{id:string,level:number,sr:(number|null)[]}[]}
const board:Leaderboard={
  benchmark:'maniladder',url:'https://maniladder-benchmark.github.io/#leaderboard',feed,
  terms:'The authors publish the leaderboard and its scoring protocol at https://maniladder-benchmark.github.io/#leaderboard.',
  aliases:{'GPT6-Astra':'gpt-6-astra'},
  stats:{
    al80:{name:'Attained level at 80% threshold',unit:'score',better:'higher'},
    meanSuccess:{name:'Mean task success rate',unit:'%',better:'higher'},
    evaluated:{name:'Tasks evaluated',unit:'count'},
    ...Object.fromEntries([1,2,3,4].flatMap(l=>[50,80].map(t=>[`level${l}At${t}`,{name:`Level ${l} tasks passing ${t}%`,unit:'count',better:'higher'}]))),
  },
  async fetch(){
    const data=jsonAfter<Data>(await fetchText(feed),'window.MANILADDER_LEADERBOARD = ');
    const levels=[1,2,3,4].map(level=>data.tasks.filter(t=>t.level===level));
    if(levels.some(ts=>ts.length!==28)||data.al.rho!==0.8||data.al.taus.join(',')!=='0.5,0.8')throw new Error('ManiLadder protocol changed');
    const parts:Record<string,BoardPart>={};
    const rows=data.models.map(({name,variant},i)=>{
      const metrics:Record<string,number>={};
      const attained:Record<string,number>={};
      for(const tau of data.al.taus){
        let count=0;
        for(const [index,group] of levels.entries()){
          const pass=group.filter(t=>t.sr[i]!==null && t.sr[i]!>=tau).length;
          metrics['level'+(index+1)+'At'+tau*100]=pass;
          if(count===index && pass/group.length>=data.al.rho)count++;
        }
        attained[tau]=count;
      }
      const values:number[]=[];
      for(const task of data.tasks){
        const raw=task.sr[i];
        const key=task.id.replace(/-/g,'_');
        parts[key]={name:task.id,group:'Level '+task.level,unit:'%'};
        if(raw===null)continue;
        if(typeof raw!=='number'||raw<0||raw>1)throw new Error('Invalid task success rate');
        metrics[key]=raw*100;values.push(raw);
      }
      metrics.evaluated=values.length;metrics.meanSuccess=100*values.reduce((a,b)=>a+b)/values.length;
      metrics.al80=attained[0.8];
      return {model:name,setting:variant,score:attained[0.5],metrics};
    });
    board.parts=parts;
    return checked(rows,4);
  },
};
export default board;
