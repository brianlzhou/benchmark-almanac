// ViLLM-Eval tests Vietnamese language understanding. The Space lists ARC-vi first
// among public tests and uses normalized accuracy. Its other tests include perplexity.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';

const feed = 'https://huggingface.co/datasets/vlsp-2023-vllm/vllms-leaderboard';
const tasks: Record<string,[string,string]> = {
  arc_vi: ['ARC-vi','acc_norm'], hellaswag_vi: ['HellaSwag-vi','acc_norm'], mmlu_vi: ['MMLU-vi','acc_norm'],
  truthfulqa_vi: ['TruthfulQA-vi','mc2'], lambada_vi: ['LAMBADA-vi','ppl'], wikipediaqa_vi: ['GeneralKnowledgeQA-vi','acc_norm'],
  comprehension_vi: ['ComprehensionQA-vi','acc_norm'], exams_vi: ['Exams-vi','acc_norm'],
};
const board: Leaderboard = {
  benchmark: 'villm-eval', url: 'https://huggingface.co/spaces/vlsp-2023-vllm/VLLMs-Leaderboard', feed,
  terms: 'The organizers publish task result files in their leaderboard repository. ' + feed,
  headline: 'The board reports no combined score, so the headline is normalized accuracy on ARC-vi, its first public task.',
  parts: Object.fromEntries(Object.entries(tasks).map(([k,[name]]) => [k,k === 'lambada_vi' ? {name,unit:'score',better:'lower',note:'Perplexity.'} : name])),
  async fetch() {
    const dir = await mkdtemp(join(tmpdir(), 'villm-eval-'));
    try {
      await promisify(execFile)('git', ['-c','core.hooksPath=/dev/null','clone','--depth=1','--quiet',feed,dir], {timeout:90000,env:{...process.env,GIT_LFS_SKIP_SMUDGE:'1',GIT_TERMINAL_PROMPT:'0'}});
      const rows = new Map<string, LeaderboardRow>();
      for (const path of await readdir(dir, {recursive:true})) {
        const match = path.match(/^([^/.]+(?:\.[^/]+)*)\/([^/]+)\/(\w+)\.json$/);
        if (!match) continue;
        const [,org,model,key] = match;
        if (!tasks[key] || /vietgpt|vinai/.test(org)) continue;
        const result = JSON.parse(await readFile(join(dir,path),'utf8')).results[key];
        const field = tasks[key][1];
        if (!Number.isFinite(result[field])) throw new Error('Missing ViLLM metric: '+field);
        const id = org+'/'+model;
        const row: LeaderboardRow = rows.get(id) ?? {model, submitter: org, score: NaN, metrics:{}};
        const score = result[field] * (field === 'ppl' ? 1 : 100);
        row.metrics![key] = score;
        if (key === 'arc_vi') {
          row.score = score;
          if (Number.isFinite(result.acc_norm_stderr)) row.metrics!.stderr = result.acc_norm_stderr * 100;
        }
        rows.set(id,row);
      }
      return checked([...rows.values()].filter(row => Number.isFinite(row.score)),9);
    } finally {
      await rm(dir,{recursive:true,force:true});
    }
  },
};
export default board;
