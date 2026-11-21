// EusTrivia tests multiple-choice knowledge in Basque. Read EusTrivia accuracy
// and its standard error from the per-model JSON releases of La Leaderboard.
import {execFileSync} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://huggingface.co/datasets/la-leaderboard/results';
export default {
  benchmark: 'eustrivia', feed, url:'https://huggingface.co/spaces/la-leaderboard/la-leaderboard', host:'La Leaderboard',
  terms:'The results dataset uses Apache 2.0. ' + feed,
  stats:{energyKwh:{name:'Energy use',unit:'count',better:'lower',note:'Energy use in kilowatt-hours.'},co2Kg:{name:'Carbon emissions',unit:'count',better:'lower',note:'Carbon emissions in kilograms.'},evaluationSeconds:{name:'Evaluation time',unit:'seconds',better:'lower'}},
  aliases: {
    '01-ai/Yi-1.5-9B-Chat':'yi-1-5-9b-chat', 'HuggingFaceTB/SmolLM2-1.7B-Instruct':'smollm2-1-7b-instruct',
    'HuggingFaceTB/SmolLM2-1.7B':'smollm2-1-7b', 'Qwen/Qwen2.5-1.5B':'qwen2-5-1-5b',
    'Qwen/Qwen2.5-3B':'qwen2-5-3b', 'Qwen/Qwen3-8B-Base':'qwen3-8b-base',
    'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B':'deepseek-r1-distill-qwen-7b',
    'google/gemma-2-2b-it':'gemma-2-2b-it','google/gemma-3-1b-pt':'gemma-3-1b-pt','google/gemma-3-4b-pt':'gemma-3-4b-pt',
  },
  async fetch() {
    const dir = await mkdtemp(join(tmpdir(),'eustrivia-'));
    try {
      execFileSync('git',['clone','--bare','--depth','1','--quiet',feed,dir],{timeout:90000});
      const read = (...args:string[]) => execFileSync('git',['-C',dir,...args],{encoding:'utf8',maxBuffer:16*1024*1024});
      const paths = read('ls-tree','-r','--name-only','HEAD').split('\n').filter(p=>/\/results_[^/]+\.json$/.test(p));
      const rows: LeaderboardRow[] = [];
      for (const path of paths) {
        const {config,results} = JSON.parse(read('show','HEAD:'+path));
        const task = results.eus_trivia;
        if (!task) continue;
        if (!Number.isFinite(task['acc,none'])) throw new Error('Invalid EusTrivia accuracy in ' + path);
        const metrics: Record<string,number> = {};
        if (typeof task['acc_stderr,none'] === 'number') metrics.stderr = 100 * task['acc_stderr,none'];
        for (const [field,key] of Object.entries({energy_kwh:'energyKwh',co2_kg:'co2Kg',total_evaluation_time_seconds:'evaluationSeconds'})) {
          if (typeof task[field] === 'number') metrics[key] = task[field];
        }
        rows.push({model:config.model_name, score:100 * task['acc,none'], metrics,
          setting:typeof task['n-shot'] === 'number' ? task['n-shot']+'-shot' : undefined});
      }
      return checked(rows,69);
    } finally {
      await rm(dir,{recursive:true,force:true});
    }
  },
} satisfies Leaderboard;
