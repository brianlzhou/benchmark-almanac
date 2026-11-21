// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// HLS-Eval tests generation and editing of high-level synthesis code. The five pass_rates.csv files
// report parseability first in the authors' tables, followed by compilation, testbench execution and synthesis.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const root = 'https://raw.githubusercontent.com/sharc-lab/hls-eval/HEAD/hls_eval_experiments/';
const tasks: Record<string, string> = {
  hls_gen_zero_shot__main: 'HLS Code Generation',
  hls_edit_zero_shot__label: 'Adding Loop Labels',
  hls_edit_zero_shot__fpx: 'Arbitrary Precision and Fixed-Point Type Translation',
  hls_edit_zero_shot__dataflow: 'Dataflow Refactoring',
  hls_edit_zero_shot__loop_tile: 'Loop Tiling',
};
const board: Leaderboard = {
  benchmark: 'hls-eval', url: 'https://github.com/sharc-lab/hls-eval',
  feed: root + 'hls_gen_zero_shot__main/data/pass_rates.csv',
  terms: 'The repository uses AGPL-3.0. https://github.com/sharc-lab/hls-eval/blob/HEAD/LICENSE',
  headline: 'The headline is the plain mean of parseability at one attempt across the five code generation and editing tasks.',
  parts: Object.fromEntries(Object.values(tasks).map(name => [name, name])),
  aliases: { 'Qwen/Qwen2.5-Coder-32B-Instruct': 'qwen2-5-coder-32b-instruct', 'deepseek-ai/DeepSeek-V3': 'deepseek-v3' },
  async fetch() {
    const models = new Map<string, Record<string, number>>();
    for (const [dir, task] of Object.entries(tasks)) {
      if (models.size) await new Promise(resolve => setTimeout(resolve, 1000));
      const records = parseCsv(await fetchText(root + dir + '/data/pass_rates.csv'));
      if (!records[0] || Object.keys(records[0]).join('|') !== 'model_name|metric_name|k|pass_rate') throw new Error('HLS-Eval columns changed');
      for (const r of records) {
        const metrics = models.get(r.model_name) ?? {};
        const key = task + '/' + r.metric_name + '/' + r.k;
        const value = Number(r.pass_rate);
        if (key in metrics || !r.pass_rate || !(value >= 0 && value <= 1)) throw new Error('Invalid HLS-Eval pass rate');
        metrics[key] = value * 100;
        models.set(r.model_name, metrics);
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, metrics] of models) {
      const names = Object.values(tasks);
      if (!names.every(n => ['1', '5'].every(k => ['pass_parse', 'pass_compile', 'pass_tb', 'pass_synth'].every(m => n + '/' + m + '/' + k in metrics)))) continue;
      for (const name of names) metrics[name] = metrics[name + '/pass_parse/1'];
      const score = names.reduce((sum, n) => sum + metrics[n], 0) / names.length;
      metrics.passAt5 = names.reduce((sum, n) => sum + metrics[n + '/pass_parse/5'], 0) / names.length;
      rows.push({ model, score, setting: 'Zero-shot', metrics, trials: 5 });
    }
    return checked(rows, 4);
  },
};
export default board;
