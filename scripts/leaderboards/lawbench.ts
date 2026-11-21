// LawBench tests Chinese legal knowledge across 20 tasks. The authors rank models by the average task score.
// The zero-shot and one-shot result files contain each task score and abstention rate as fractions.
// Average the 20 task scores and multiply by 100 to reproduce the published AVG column.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {fetchText,parseCsv} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const root='https://raw.githubusercontent.com/open-compass/LawBench/HEAD/predictions/';
const taskIds=[...Array.from({length:2},(_,i)=>'1-'+(i+1)),...Array.from({length:10},(_,i)=>'2-'+(i+1)),...Array.from({length:8},(_,i)=>'3-'+(i+1))];
const board:Leaderboard={
  benchmark:'lawbench',url:'https://github.com/open-compass/LawBench',feed:root+'zero_shot/results.csv',
  terms:'LawBench repository terms: https://github.com/open-compass/LawBench#license',
  parts:Object.fromEntries(taskIds.map(k=>[k,'Task '+k])),
  stats:Object.fromEntries(taskIds.map(k=>[k+' abstention',{name:'Task '+k+' abstention rate',unit:'%',better:'lower'}])),
  aliases:{'GPT-3.5-turbo-0613':'gpt-3-5-turbo-jun-2023','chatglm2-6b-hf':'chatglm2-6b','internlm-7b-hf':'internlm-7b','mpt-7b-hf':'mpt-7b','qwen-7b-hf':'qwen-7b'},
  async fetch(){
    const rows:LeaderboardRow[]=[];
    for(const setting of ['zero_shot','one_shot']){
      if(rows.length) await new Promise(resolve=>setTimeout(resolve,1000));
      const models=new Map<string,Record<string,number>>();
      for(const r of parseCsv(await fetchText(root+setting+'/results.csv'))){
        const metrics=models.get(r.model_name)??{};
        if(!r.model_name || !taskIds.includes(r.task) || r.task in metrics || !r.score?.trim() || !r.abstention_rate?.trim()) throw Error('Invalid LawBench result');
        metrics[r.task]=Number(r.score)*100;
        metrics[r.task+' abstention']=Number(r.abstention_rate)*100;
        models.set(r.model_name,metrics);
      }
      for(const [model,metrics] of models){
        if(!Object.values(metrics).every(Number.isFinite)) throw Error('Invalid values for '+model);
        const mean=taskIds.reduce((sum,key)=>sum+metrics[key],0)/taskIds.length;
        rows.push({model,setting:setting.replace('_','-'),score:mean,metrics});
      }
    }
    return checked(rows,102);
  },
};
export default board;
