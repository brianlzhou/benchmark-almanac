// PFBench tests answers to power-flow questions. The official public-test leaderboard
// summaries report accuracy across 1,570 questions. Companion run metadata gives token use.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://api.github.com/repos/shebuxin/pfbench/contents/runs';
type Result = {split_filter: string, num_questions_in_dataset: number, num_predictions_matched: number,
  accuracy: number, mean_score: number, num_passed: number, by_query_family: Record<string, {accuracy: number, count: number}>};
type Run = {model: string, split: string, reasoning_effort: string, completed_at: string, num_questions_selected: number,
  usage: {prompt_tokens: number, completion_tokens: number, total_tokens: number}};
const board: Leaderboard = {
  benchmark: 'pfbench', url: 'https://github.com/shebuxin/pfbench/tree/main/runs', feed,
  terms: 'The dataset terms are at https://github.com/shebuxin/pfbench/blob/main/datasets/pfbench/v1/LICENSE_AND_REDISTRIBUTION.md.',
  stats: { meanScore: {name: 'Mean graded score', unit: 'score'}, passed: {name: 'Questions passed', unit: 'count'},
    inputTokens: {name: 'Input tokens per question', unit: 'tokens'}, outputTokens: {name: 'Output tokens per question', unit: 'tokens'},
    totalTokens: {name: 'Total tokens per question', unit: 'tokens'} },
  async fetch() {
    const files = await fetchJson<{name: string, download_url: string}[]>(feed);
    const summaries = files.filter(f => f.name.endsWith('_public_test_leaderboard.json'));
    const rows: LeaderboardRow[] = [];
    for (const file of summaries) {
      const metadata = files.find(f => f.name === file.name.replace('_leaderboard.json', '.run.json'));
      if (!metadata) throw new Error('Missing run metadata for ' + file.name);
      const result = await fetchJson<Result>(file.download_url);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const run = await fetchJson<Run>(metadata.download_url);
      const count = result.num_questions_in_dataset;
      if (run.split !== 'public_test' || result.split_filter !== run.split || count !== 1570
          || result.num_predictions_matched !== count || run.num_questions_selected !== count) throw new Error('Incomplete public test');
      const pct = (value: number) => {
        if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('Invalid accuracy');
        return Number((100 * value).toFixed(4));
      };
      const metrics: Record<string, number> = { meanScore: result.mean_score, passed: result.num_passed,
        inputTokens: run.usage.prompt_tokens / count, outputTokens: run.usage.completion_tokens / count, totalTokens: run.usage.total_tokens / count };
      const parts = Object.entries(result.by_query_family);
      if (parts.length !== 10 || parts.some(([, v]) => v.count !== 157)) throw new Error('Missing query families');
      for (const [family, values] of parts) metrics[family] = pct(values.accuracy);
      board.parts = Object.fromEntries(parts.map(([family]) => [family, family.replaceAll('_', ' ')]));
      rows.push({model: run.model, setting: run.reasoning_effort + ' reasoning', score: pct(result.accuracy),
        date: run.completed_at.slice(0, 10), tokens: metrics.outputTokens, metrics});
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return checked(rows, 3);
  },
};
export default board;
