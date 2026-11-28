// GPU Puzzles scores GPU programming exercises. The dashboard displays the mean reward from each evaluation.
// The shared reader follows the dashboard's public evaluation list and converts fractions for percentage boards.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const api = 'https://app.primeintellect.ai/api/trpc/environments.';
export const primeFeed = (environmentId: string, skip = 0) => api + 'getEvaluationsFromMongoDB?input='
  + encodeURIComponent(JSON.stringify({ json: { environmentId, skip, limit: 100 } }));
export const primeTerms = "Prime Intellect allows environment pages and disallows /api in robots.txt. Its terms apply to the public evaluations.";
interface Evaluation {
  _id: string;
  statistics: { avgReward: number | null };
  framework?: string;
  detailedMetrics?: { metricsStats?: Record<string,{ mean?: number }> };
  metadata?: { time_ms?: number, time?: number, model?: string, num_examples?: number, rollouts_per_example?: number, date?: string, sampling_args?: { reasoning_effort?: string }, usage?: { input_tokens?: number, output_tokens?: number } };
  model_name?: string;
  createdAt?: string;
  semanticVersion?: string;
  team?: { name?: string, slug?: string };
  user?: { name?: string, slug?: string };
}
export async function primeRows(url: string, environmentId: string, scale: number, minimum: number) {
  const rows: LeaderboardRow[] = [];
  let skip = 0;
  while (true) {
    const payload = await fetchJson<{ result: { data: { json: { evaluations: Evaluation[], pagination: { total: number, hasMore: boolean } } } } }>(primeFeed(environmentId, skip));
    const { evaluations, pagination } = payload.result.data.json;
    for (const entry of evaluations) {
      const reward = entry.statistics?.avgReward;
      if (reward === null || reward === undefined) continue;
      const m = entry.metadata;
      const model = m?.model || entry.model_name;
      if (!model || !Number.isFinite(reward) || !entry._id) throw new Error('Invalid Prime Intellect evaluation');
      const settings = [entry.semanticVersion, m?.num_examples === -1 ? 'all examples' : m?.num_examples ? m.num_examples + ' examples' : '', m?.sampling_args?.reasoning_effort].filter(Boolean);
      const metrics: Record<string,number> = {};
      for (const [key, stats] of Object.entries(entry.detailedMetrics?.metricsStats ?? {})) {
        if (typeof stats.mean === 'number' && Number.isFinite(stats.mean)) metrics[key] = stats.mean;
      }
      if (m?.time_ms != null) metrics.runSeconds = m.time_ms / 1000;
      else if (typeof m?.time === 'number' && Number.isFinite(m.time)) metrics.runSeconds = m.time;
      if (typeof m?.usage?.input_tokens === 'number' && Number.isFinite(m.usage.input_tokens) && m.usage.input_tokens > 0) metrics.inputTokens = m.usage.input_tokens;
      const tokens = typeof m?.usage?.output_tokens === 'number' && Number.isFinite(m.usage.output_tokens) && m.usage.output_tokens > 0 ? m.usage.output_tokens : undefined;
      rows.push({ model, harness:entry.framework || undefined, metrics, score: reward * scale, setting: settings.join(', ') || undefined, trials: m?.rollouts_per_example,
        tokens, date: (m?.date || entry.createdAt)?.slice(0, 10), submitter: entry.team?.name || entry.team?.slug || entry.user?.name || entry.user?.slug,
        link: url + '/' + entry._id });
    }
    skip += evaluations.length;
    if (!pagination.hasMore) {
      if (skip !== pagination.total) throw new Error('Incomplete Prime Intellect pagination');
      break;
    }
    if (!evaluations.length) throw new Error('Empty Prime Intellect page');
    await new Promise(resolve => setTimeout(resolve, 1050));
  }
  if (rows.length < minimum) throw new Error('Missing scored Prime Intellect evaluations');
  return rows;
}
const env = 'zhlprpw1otth3d7dbui4dm15';
const board: Leaderboard = {
  benchmark: 'gpu-puzzles',
  url: 'https://app.primeintellect.ai/dashboard/environments/primeintellect/gpu-puzzles/evals',
  feed: primeFeed(env),
  terms: primeTerms,
  stats: { runSeconds: { name: 'Run time', unit: 'seconds', better: 'lower' } },
  fetch() { return primeRows(this.url, env, 100, 2); },
};
export default board;
