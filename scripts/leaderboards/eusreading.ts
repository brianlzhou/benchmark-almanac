// EusReading tests comprehension of Basque passages with 352 multiple-choice questions.
// La Leaderboard publishes accuracy and standard error for the complete task in each model's results file.
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed='https://huggingface.co/datasets/la-leaderboard/results';
const board:Leaderboard={
  benchmark:'eusreading',url:'https://huggingface.co/spaces/la-leaderboard/la-leaderboard',feed,host:'La Leaderboard',
  terms:'The results dataset uses Apache 2.0. '+feed,
  aliases:{ 'HuggingFaceTB/SmolLM2-1.7B':'smollm2-1-7b','HuggingFaceTB/SmolLM2-1.7B-Instruct':'smollm2-1-7b-instruct',
    '01-ai/Yi-1.5-9B-Chat':'yi-1-5-9b-chat','Qwen/Qwen3-8B-Base':'qwen3-8b-base','Qwen/Qwen2.5-1.5B':'qwen2-5-1-5b',
    'Qwen/Qwen2.5-3B':'qwen2-5-3b','deepseek-ai/DeepSeek-R1-Distill-Qwen-7B':'deepseek-r1-distill-qwen-7b',
    'google/gemma-3-4b-pt':'gemma-3-4b-pt','google/gemma-3-1b-pt':'gemma-3-1b-pt','google/gemma-2-2b-it':'gemma-2-2b-it' },
  async fetch(){
    const dir=await mkdtemp(join(tmpdir(),'eusreading-'));
    try {
      execFileSync('git',['clone','--bare','--depth','1','--quiet',feed,dir],{timeout:90000});
      const read=(...args:string[])=>execFileSync('git',['-C',dir,...args],{encoding:'utf8',maxBuffer:16*1024*1024});
      const rows:LeaderboardRow[]=[];
      for(const path of read('ls-tree','-r','--name-only','HEAD').trim().split('\n').filter(p=>/\/results_[^/]+\.json$/.test(p))){
        const {config,results}=JSON.parse(read('show','HEAD:'+path));
        const r=results?.eus_reading;
        if(!r) continue;
        if(!config.model_name || !Number.isFinite(r['acc,none']) || !Number.isFinite(r['acc_stderr,none'])) throw new Error('Missing EusReading accuracy or standard error');
        const metrics:Record<string,number>={stderr:r['acc_stderr,none']*100};
        for(const [field,key] of [['total_evaluation_time_seconds','evaluationSeconds'],['energy_kwh','energyKwh'],['co2_kg','co2Kg']]){
          if(Number.isFinite(r[field])) metrics[key]=r[field];
        }
        rows.push({model:config.model_name,score:r['acc,none']*100,metrics,
          ...(Number.isInteger(r['n-shot'])?{setting:r['n-shot']+'-shot'}:{})});
      }
      return checked(rows,69);
    } finally {await rm(dir,{recursive:true,force:true});}
  },
};
export default board;
