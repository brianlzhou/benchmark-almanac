// Season 1 evaluates Korean language understanding on five tasks. The Space divides
// "sum([v for v in self.results.values() if v is not None])" by the number of tasks.
// The archived results include submissions hidden by the Space's default model filters.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const feed = 'https://huggingface.co/datasets/choco9966/results';
const tasks = [
  ['ko_arc_challenge', 'Ko-ARC', 'acc_norm'],
  ['ko_hellaswag', 'Ko-HellaSwag', 'acc_norm'],
  ['ko_mmlu', 'Ko-MMLU', 'acc'],
  ['ko_truthfulqa_mc', 'Ko-TruthfulQA', 'mc2'],
  ['ko_commongen_v2', 'Ko-CommonGen V2', 'acc_norm'],
] as const;

const board: Leaderboard = {
  benchmark: 'open-ko-llm-leaderboard',
  url: 'https://huggingface.co/spaces/choco9966/open-ko-llm-leaderboard-old',
  feed,
  terms: 'Season 1 Space software uses Apache 2.0. The organizers publish task-specific terms in Table 1. https://aclanthology.org/2024.acl-long.177/',
  parts: Object.fromEntries(tasks.map(([key, name]) => [key, name])),
  async fetch() {
    const dir = await mkdtemp(join(tmpdir(), 'ko-season-one-'));
    try {
      await promisify(execFile)('git', ['-c', 'core.hooksPath=/dev/null', 'clone', '--quiet', '--depth=1', feed, dir], {
        timeout: 90000, env: {...process.env, GIT_LFS_SKIP_SMUDGE: '1', GIT_TERMINAL_PROMPT: '0'},
      });
      const files = (await readdir(dir, {recursive: true})).filter(path => /\/results?_.*\.json$/.test(path)).sort();
      const latest = new Map<string, LeaderboardRow>();
      for (const file of files) {
        const raw = await readFile(join(dir, file), 'utf8');
        const data = JSON.parse(raw.replace(/:\s*NaN(?=\s*[,}])/g, ': null'));
        const config = data.config_general ?? data.config;
        const model = config.model_name;
        const setting = config.model_dtype;
        if (!model || !setting) throw new Error('Missing Season 1 model or precision');
        const results: Record<string, Record<string, number | null>> = data.results;
        const metrics: Record<string, number> = {};
        for (const [key, , metric] of tasks) {
          const values = Object.entries(results).filter(([name]) => name.includes(key)).map(([, result]) => result[metric]);
          if (!values.length || values.some(v => v === undefined)) throw new Error('Missing Season 1 task metric: ' + key);
          if (values.every((v): v is number => typeof v === 'number' && Number.isFinite(v))) {
            metrics[key] = values.reduce((a,b) => a+b, 0) * 100 / values.length;
          }
        }
        latest.set(JSON.stringify([model, setting]), {model, setting, metrics, score: Object.values(metrics).reduce((a,b) => a+b, 0) / tasks.length});
      }
      return checked([...latest.values()].filter(row => Object.keys(row.metrics!).length === tasks.length), 1741);
    } finally {
      await rm(dir, {recursive: true, force: true});
    }
  },
};
export default board;
