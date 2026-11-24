// Models fix buggy Python functions and face hidden tests. Only Level 3 measures code repair.
// The authors' matrix summary gives each model's Level 3 overall mean reward and task scores for the detailed cohort.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const repo = 'https://huggingface.co/poolside-laguna-hackathon/laguna-eval-experiments';
const feed = repo + '/raw/main/environments/py_bug_trace/reports/matrix/summary.json';
interface Summary {
  cross_level: { model_id: string, levels: Record<string, number>, rank_by_level: Record<string, number | null>,
    delta_vs_target: Record<string, number> }[];
  levels: Record<string, { models: { model: string }[],
    tasks: { name: string, results: { hits: string, avg_score: number, avg_output_tokens: number }[] }[] }>;
}
const board: Leaderboard = {
  benchmark: 'py-bug-trace-level-3', feed, url: 'https://neomatrix369.github.io/pages/laguna-py-bug-trace.html',
  terms: 'The authors publish the matrix on Hugging Face. https://huggingface.co/terms-of-service',
  stats: { rank: { name: 'Level 3 rank', unit: 'count', better: 'lower' },
    delta: { name: 'Difference from Laguna-XS.2 in percentage points', unit: 'score', better: 'higher' } },
  async fetch() {
    const summary = await fetchJson<Summary>(feed);
    const detail = summary.levels['3'];
    if (!detail?.tasks.length || !detail.models.length || !summary.cross_level?.length) throw new Error('Missing Level 3 matrix');
    board.parts = Object.fromEntries(detail.tasks.map(t => [t.name, t.name]));
    return checked(summary.cross_level.map(row => {
      const score = row.levels['3'];
      const rank = row.rank_by_level['3'];
      const delta = row.delta_vs_target['3'];
      if (![score, delta].every(Number.isFinite) || (rank !== null && !Number.isFinite(rank))) throw new Error('Missing Level 3 result');
      const metrics: Record<string, number> = { delta: delta * 100 };
      if (rank !== null) metrics.rank = rank;
      const i = detail.models.findIndex(m => m.model === row.model_id);
      let attempts = 0;
      let outputTokens = 0;
      if (i >= 0) for (const task of detail.tasks) {
        const result = task.results[i];
        if (!result || !Number.isFinite(result.avg_score)) throw new Error('Missing Level 3 task result');
        const count = result.hits.match(/^\d+\/(\d+)$/);
        if (!count || !Number.isFinite(result.avg_output_tokens)) throw new Error('Invalid Level 3 rollout statistics');
        const n = Number(count[1]);
        if (n) metrics[task.name] = result.avg_score * 100;
        attempts += n;
        outputTokens += n * result.avg_output_tokens;
      }
      return { model: row.model_id, score: 100 * score, ...(attempts ? { tokens: outputTokens / attempts } : {}), metrics };
    }), 29);
  },
};
export default board;
