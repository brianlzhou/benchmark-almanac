// Models calculate investment returns, decide whether to invest, and explain the decision.
// Prime's public evaluations tab reports mean reward on each run, including a distinct Thinking checkpoint.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://app.primeintellect.ai/dashboard/environments/dsm/roi-calculator/evals';
const environmentId = 'oyjxmwsnqvbtgqikgxf1iktv';
function pageUrl(skip: number) {
  const endpoint = new URL('https://app.primeintellect.ai/api/trpc/environments.getEvaluationsFromMongoDB');
  endpoint.searchParams.set('input', JSON.stringify({ json: { environmentId, skip, limit: 100 } }));
  return endpoint.href;
}
interface Evaluation {
  model_name: string; avg_score: number; total_samples: number; started_at: string; status: string; semanticVersion: string;
  min_score: number; max_score: number; metrics: { avg_error: number }; user: { name: string };
  metadata: { rollouts_per_example: number; usage?: { input_tokens: number; output_tokens: number } };
}
interface Page { result: { data: { json: { evaluations: Evaluation[]; pagination: { hasMore: boolean } } } } }
const board: Leaderboard = {
  benchmark: 'roi-calculator', url, feed: pageUrl(0),
  terms: 'Prime Intellect publishes the public evaluation results under its terms. https://www.primeintellect.ai/terms-of-service',
  stats: { samples: { name: 'Scored samples', unit: 'count' }, inputTokens: { name: 'Mean input tokens', unit: 'tokens' },
    outputTokens: { name: 'Mean output tokens', unit: 'tokens' }, min: { name: 'Minimum sample reward', unit: 'score' },
    max: { name: 'Maximum sample reward', unit: 'score' }, error: { name: 'Mean error rate', unit: 'score', better: 'lower' } },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (let skip = 0; ; skip += 100) {
      const { evaluations, pagination } = (await fetchJson<Page>(pageUrl(skip))).result.data.json;
      for (const e of evaluations) {
        if (e.status !== 'COMPLETED') continue;
        if (!e.model_name || !Number.isFinite(e.avg_score) || !Number.isFinite(e.total_samples)) throw new Error('Missing ROI run data');
        const usage = e.metadata.usage;
        rows.push({ model: e.model_name, date: e.started_at.slice(0, 10), setting: 'v' + e.semanticVersion + ', run ' + e.started_at,
          score: e.avg_score, submitter: e.user.name, trials: e.metadata.rollouts_per_example,
          metrics: { samples: e.total_samples, min: e.min_score, max: e.max_score, error: e.metrics.avg_error,
            ...(usage && { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens }) } });
      }
      if (!pagination.hasMore) break;
      if (evaluations.length !== 100) throw new Error('Incomplete ROI evaluation page');
    }
    return checked(rows, 2);
  },
};
export default board;
