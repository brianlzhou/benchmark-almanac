// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// The Open Medical LLM Leaderboard tests multiple-choice medical knowledge. Its results repository
// gives accuracy by MMLU subject and records the model's numerical precision.
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://huggingface.co/datasets/openlifescienceai/results';
const parts = {
  mmlu_anatomy: 'Anatomy', mmlu_clinical_knowledge: 'Clinical knowledge', mmlu_college_biology: 'College biology',
  mmlu_college_medicine: 'College medicine', mmlu_medical_genetics: 'Medical genetics', mmlu_professional_medicine: 'Professional medicine',
};
const board: Leaderboard = {
  benchmark: 'mmlu-medical', host: 'Open Medical LLM Leaderboard',
  url: 'https://huggingface.co/spaces/openlifescienceai/open_medical_llm_leaderboard', feed, parts,
  terms: 'The leaderboard publishes these results on Hugging Face under https://huggingface.co/terms-of-service.',
  headline: 'The Open Medical LLM Leaderboard reports no medical-only overall score, so this is the plain mean of its six MMLU subject accuracies.',
  async fetch() {
    const dir = await mkdtemp(join(tmpdir(), 'mmlu-medical-'));
    try {
      execFileSync('git', ['clone', '--quiet', '--bare', '--depth=1', feed, dir], {timeout: 90_000, env: {...process.env, GIT_TERMINAL_PROMPT: '0'}});
      const read = (args: string[]) => execFileSync('git', ['--git-dir', dir, ...args], {encoding:'utf8'});
      const files = read(['ls-tree', '-rz', '--name-only', 'HEAD']).split('\0').filter(p => /(^|\/)results_[^/]+\.json$/.test(p)).sort();
      const rows = new Map<string, LeaderboardRow>();
      for (const file of files) {
        const data = JSON.parse(read(['show', 'HEAD:' + file]));
        const model = data.config.model_name;
        const setting = data.config.model_dtype;
        if (!model || !data.results) throw new Error('Missing metadata in ' + file);
        const metrics: Record<string, number> = {};
        for (const key of Object.keys(parts)) {
          const value = data.results[key]?.['acc,none'];
          if (value === undefined) continue;
          if (typeof value !== 'number' || value < 0 || value > 1) throw new Error('Invalid accuracy in ' + file);
          metrics[key] = value * 100;
          const stderr = data.results[key]['acc_stderr,none'];
          if (typeof stderr === 'number') metrics[key + 'Stderr'] = stderr * 100;
        }
        if (!Object.keys(parts).every(k => k in metrics)) continue;
        const score = Object.keys(parts).reduce((sum, k) => sum + metrics[k], 0) / 6;
        rows.set(JSON.stringify([model, setting]), {model, setting, metrics, score});
      }
      return checked([...rows.values()], 192);
    } finally {
      await rm(dir, {recursive: true, force: true});
    }
  },
};
export default board;
