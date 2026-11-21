// Open Ko-LLM Leaderboard 2 averages nine Korean evaluations. Its Space reads the public results repository in date order.
// A shallow checkout reads all model files in one transfer. The dataset viewer exposes only a subset.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';

const FEED = "https://huggingface.co/datasets/open-ko-llm-leaderboard/results";

const tasks: Record<string,[string,string]> = {
  ko_gpqa_diamond_zeroshot: ['Ko-GPQA','acc_norm,none'], ko_winogrande: ['Ko-Winogrande','acc,none'],
  ko_gsm8k: ['Ko-GSM8k','exact_match,strict-match'], ko_eqbench: ['Ko-EQ Bench','eqbench,none'],
  ko_ifeval: ['Ko-IFEval','inst_level_strict_acc,none'], kornat_common: ['KorNAT-CKA','acc_norm,none'],
  kornat_social: ['KorNAT-SVA','A-SVA,none'], kornat_harmless: ['Ko-Harmlessness','acc_norm,none'], kornat_helpful: ['Ko-Helpfulness','acc_norm,none']
};

const board: Leaderboard = {
  benchmark: "open-ko-llm-leaderboard-2",
  url: "https://huggingface.co/spaces/upstage/open-ko-llm-leaderboard",
  feed: FEED,
  terms: "The Space lists Apache 2.0 for its software. Upstage describes the evaluation data as private. https://huggingface.co/spaces/upstage/open-ko-llm-leaderboard/blob/main/README.md",
  parts: Object.fromEntries(Object.entries(tasks).map(([key,[name]]) => [key,name])),
  async fetch() {
    const dir = await mkdtemp(join(tmpdir(),'open-ko-results-'));
    try {
      await promisify(execFile)('git',['-c','core.hooksPath=/dev/null','clone','--quiet','--depth=1',FEED,dir],{timeout: 90000,env:{...process.env,GIT_LFS_SKIP_SMUDGE:'1',GIT_TERMINAL_PROMPT:'0'}});
      const files = (await readdir(dir,{recursive:true,withFileTypes:true})).filter(f => f.isFile() && /^results?_.*\.json$/.test(f.name)).map(f => join(f.parentPath,f.name)).sort();
      const models = new Map<string,LeaderboardRow>();
      for (const file of files) {
        const data = JSON.parse(await readFile(file,'utf8'));
        const config = data.config_general ?? data.config;
        const model = config.model_name;
        const setting = config.model_dtype;
        if (!model || !setting) throw new Error('Missing Open Ko model or precision');
        const key = model + '/' + setting;
        const row: LeaderboardRow = models.get(key) ?? {model, setting, score: 0, metrics: {}};
        for (const [task,[,field]] of Object.entries(tasks)) {
          const result = data.results[task];
          if (typeof result?.[field] !== 'number') continue;
          const v = task === 'ko_ifeval' ? (result[field] + result['prompt_level_strict_acc,none']) / 2 : result[field];
          if (!Number.isFinite(v)) throw new Error('Invalid Open Ko result: '+task);
          row.metrics![task] = task === 'ko_eqbench' ? v : v*100;
        }
        models.set(key,row);
      }
      const rows = [...models.values()].filter(r => Object.keys(r.metrics!).length === Object.keys(tasks).length);
      for (const row of rows) row.score = Object.values(row.metrics!).reduce((sum,v) => sum+v,0) / Object.keys(tasks).length;
      if (rows.length < 1201) throw new Error('Incomplete Open Ko results checkout');
      return rows;
    } finally {
      await rm(dir,{recursive:true,force:true});
    }
  },
};
export default board;
