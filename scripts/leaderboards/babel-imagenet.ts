// The source reports no overall score. The headline is the plain mean of the 298 parts, computed by this importer.
// Babel-ImageNet tests zero-shot image classification with multilingual labels. The
// authors' notebook uses translated prompts when available and falls back to labels.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
const feed = 'https://github.com/gregor-ge/Babel-ImageNet';
const board: Leaderboard = {
  benchmark:'babel-imagenet', url:feed+'/tree/HEAD/results/babel-imagenet', feed,
  terms:'The authors license code under MIT and labels under the BabelNet Non-Commercial License. '+feed+'#license',
  headline:'The authors report no overall score, so this is the plain mean of accuracy across the 298 languages.',
  async fetch() {
    const dir = await mkdtemp(join(tmpdir(),'babel-imagenet-'));
    try {
      await promisify(execFile)('git',['-c','core.hooksPath=/dev/null','clone','--quiet','--depth=1',feed,dir],
        {timeout:90000,env:{...process.env,GIT_LFS_SKIP_SMUDGE:'1',GIT_TERMINAL_PROMPT:'0'}});
      const path = join(dir,'results','babel-imagenet');
      const names = JSON.parse(await readFile(join(dir,'data','language_mapping.json'),'utf8'));
      const languages = Object.keys(JSON.parse(await readFile(join(dir,'data','babel_imagenet-298.json'),'utf8')));
      if (languages.length !== 298) throw new Error('Changed Babel-ImageNet language set');
      board.parts = Object.fromEntries(languages.map(code => [code,names[code] ?? code]));
      const rows: LeaderboardRow[] = [];
      for (const file of (await readdir(path)).filter(file => file.endsWith('.json'))) {
        const data = JSON.parse(await readFile(join(path,file),'utf8'));
        const metrics: Record<string,number> = {};
        for (const prompt of ['label','nllb_dist13b_prompts']) {
          for (const record of data.results) {
            if (record.prompt !== prompt) continue;
            if (!Number.isFinite(record.accuracy)) throw new Error('Missing language accuracy');
            metrics[record.lang] = record.accuracy * 100;
          }
        }
        if (languages.some(code => !(code in metrics))) continue;
        const score = languages.reduce((sum,code) => sum+metrics[code],0)/languages.length;
        rows.push({model:data.meta.model,params:data.meta.parameters/1e9,score,metrics});
      }
      return checked(rows,12);
    } finally {
      await rm(dir,{recursive:true,force:true});
    }
  },
};
export default board;
