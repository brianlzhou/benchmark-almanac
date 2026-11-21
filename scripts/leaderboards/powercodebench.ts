// PowerCodeBench tests code generation for power-system analysis on 2,000 tasks.
// The authors' proactive and reactive comparison files report how often execution yields the correct result.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';

const root = 'https://raw.githubusercontent.com/huiwxing/PowerCodeBench/HEAD/results/aggregates/api_comparison_2000/';
const groups = {per_task: 'Task', per_gt_type: 'Ground truth type', per_query_type: 'Query type',
  per_n_modifications: 'Number of modifications', per_network: 'Network', per_difficulty: 'Difficulty'};
type Run = {n_total: number, n_matched: number, result_accuracy: number, execution_rate: number,
  total_prompt_token_stats: {total?: number}} & Record<keyof typeof groups, Record<string, {accuracy: number}>>;
const board: Leaderboard = {
  benchmark: 'powercodebench', url: 'https://github.com/huiwxing/PowerCodeBench', feed: root + 'reactive_comparison.json',
  terms: 'The authors publish the data under CC BY 4.0. https://github.com/huiwxing/PowerCodeBench/blob/HEAD/LICENSE',
  aliases: {'Llama-3.1-405B-Instruct': 'llama-3-1-405b', 'Llama-3.1-70B-Instruct': 'llama-3-1-70b', 'Llama-3.1-8B-Instruct': 'llama-3-1-8b'},
  parts: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const kind of ['proactive', 'reactive']) {
      const conditions = await fetchJson<Record<string, Record<string, Run>>>(root + kind + '_comparison.json');
      for (const [setting, panel] of Object.entries(conditions)) {
        for (const [label, run] of Object.entries(panel)) {
          if (run.n_total !== 2000 || Math.abs(run.result_accuracy - run.n_matched / run.n_total) > 0.00001) throw new Error('Invalid accuracy for ' + label);
          const metrics: Record<string, number> = {executionRate: 100 * run.execution_rate, correct: run.n_matched};
          const tokens = run.total_prompt_token_stats.total;
          if (typeof tokens === 'number') metrics.inputTokens = tokens / run.n_total;
          for (const group of Object.keys(groups) as (keyof typeof groups)[]) {
            for (const [part, result] of Object.entries(run[group])) {
              const key = group + '_' + part;
              if (!Number.isFinite(result.accuracy)) throw new Error('Invalid part score for ' + key);
              board.parts![key] = {name: part.replaceAll('_', ' '), group: groups[group]};
              metrics[key] = result.accuracy * 100;
            }
          }
          rows.push({model: label.replace(/^(?:Qwen|meta-llama|openai)_/, ''), setting, score: run.result_accuracy * 100, metrics});
        }
      }
    }
    return checked(rows, 196);
  },
};
export default board;
