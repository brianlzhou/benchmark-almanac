// EusExams tests multiple-choice questions from Basque public service examinations.
// Read raw accuracy from La Leaderboard's released results. For releases with one score per exam,
// recover the correct-answer count for each exam and divide their sum by the number of evaluated questions.
// Counts come from the authors' released test outputs at github.com/hitz-zentroa/latxa/tree/main/evaluation/results.
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://huggingface.co/datasets/la-leaderboard/results';
const counts: Record<string,number> = {
  ejadministrari:696, ejlaguntza:498, ejlaguntzaile:697, ejteknikari:687, opebilbaoeu:630,
  opeehuadmineu:499, opeehuauxeu:450, opeehubiblioeu:599, opeehuderechoeu:700, opeehueconomicaseu:351,
  opeehuempresarialeseu:280, opeehusubalternoeu:400, opeehutecnicoeu:699, opeehuteknikarib:599,
  opegasteizkoudala:360, opeosakiadmineu:236, opeosakiauxenfeu:167, opeosakiauxeu:165,
  opeosakiceladoreu:163, opeosakienfeu:373, opeosakioperarioeu:131, opeosakitecnicoeu:321,
  opeosakivarioseu:266, osakidetza1e:647, osakidetza2e:748, osakidetza3e:549, osakidetza5e:650,
  osakidetza6e:1000, osakidetza7e:2163,
};
const board: Leaderboard = {
  benchmark:'eusexams', url:'https://huggingface.co/spaces/la-leaderboard/la-leaderboard', feed, host:'La Leaderboard',
  terms:'The results dataset uses Apache 2.0. ' + feed, parts:Object.fromEntries(Object.keys(counts).map(k=>[k,k])),
  aliases:{ 'HuggingFaceTB/SmolLM2-1.7B':'smollm2-1-7b','HuggingFaceTB/SmolLM2-1.7B-Instruct':'smollm2-1-7b-instruct',
    '01-ai/Yi-1.5-9B-Chat':'yi-1-5-9b-chat','Qwen/Qwen3-8B-Base':'qwen3-8b-base','Qwen/Qwen2.5-1.5B':'qwen2-5-1-5b',
    'Qwen/Qwen2.5-3B':'qwen2-5-3b','deepseek-ai/DeepSeek-R1-Distill-Qwen-7B':'deepseek-r1-distill-qwen-7b',
    'google/gemma-3-4b-pt':'gemma-3-4b-pt','google/gemma-3-1b-pt':'gemma-3-1b-pt','google/gemma-2-2b-it':'gemma-2-2b-it' },
  async fetch() {
    const dir = await mkdtemp(join(tmpdir(),'eusexams-'));
    try {
      execFileSync('git',['clone','--bare','--depth','1','--quiet',feed,dir],{timeout:90000});
      const read = (args:string[]) => execFileSync('git',['-C',dir,...args],{encoding:'utf8',maxBuffer:16*1024*1024});
      const paths = read(['ls-tree','-r','--name-only','HEAD']).trim().split('\n').filter(p=>/\/results_[^/]+\.json$/.test(p));
      const rows: LeaderboardRow[] = [];
      for (const path of paths) {
        const {config, results} = JSON.parse(read(['show','HEAD:' + path]));
        const model = config.model_name;
        const total = results.eus_exams_eu;
        const metrics: Record<string,number> = {};
        let score: number;
        if (total) {
          if (typeof total['acc,none'] !== 'number') throw Error('Missing overall accuracy for ' + model);
          score = total['acc,none'] * 100;
          for (const [key,label] of Object.entries({total_evaluation_time_seconds:'evaluationSeconds',energy_kwh:'energyKwh',co2_kg:'co2Kg'})) {
            if (typeof total[key] === 'number') metrics[label] = total[key];
          }
        } else {
          let correct = 0, questions = 0;
          if (!Object.keys(results).some(k=>k.startsWith('eus_exams_eu_'))) continue;
          for (const [exam,count] of Object.entries(counts)) {
            const part = results['eus_exams_eu_' + exam];
            const acc = part?.['acc,none'];
            if (typeof acc !== 'number' || Math.abs(Math.round(acc*count)-acc*count)>1e-6) throw Error('Unexpected denominator for ' + exam);
            metrics[exam] = acc*100;
            if (typeof part['acc_stderr,none'] === 'number') metrics[exam+'Stderr'] = part['acc_stderr,none']*100;
            correct += Math.round(acc*count);
            questions += count;
          }
          score = correct / questions * 100;
        }
        rows.push({ model, score, metrics, ...(typeof total?.['n-shot'] === 'number' ? {setting:total['n-shot']+'-shot'} : {}) });
      }
      return checked(rows,69);
    } finally {
      await rm(dir,{recursive:true,force:true});
    }
  },
};
export default board;
