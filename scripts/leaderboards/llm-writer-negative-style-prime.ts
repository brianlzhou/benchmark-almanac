// Prime Intellect lists the mean reward for each published evaluation of this writing style task.
// The dashboard's public results query supplies the runs, rollout counts and evaluation links.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const endpoint = 'https://app.primeintellect.ai/api/trpc/environments.getEvaluationsFromMongoDB';
export function primeFeed(environmentId: string, skip = 0) {
  return endpoint + '?input=' + encodeURIComponent(JSON.stringify({ json: { environmentId, skip, limit: 100 } }));
}
export const primeTerms = "Prime Intellect's robots.txt allows environment pages and disallows /api. The public dashboard reads this query. Prime Intellect's terms apply.";
interface Evaluation {
  _id: string;
  semanticVersion?: string;
  environment_ids: string[];
  statistics: { avgReward: number | null; totalResults: number };
  metadata: { framework?: string; usage?: { output_tokens?: number }; cost?: { total_usd?: number }; time?: number | string; avg_metrics?: Record<string, number>; model: string; date?: string; rollouts_per_example?: number; num_examples?: number; sampling_args?: { reasoning_effort?: string } };
  team?: { slug?: string; name?: string };
  user?: { slug?: string; name?: string };
  created_at?: string;
}
export async function primeRows(id: string, page: string, minimum: number, major?: number): Promise<LeaderboardRow[]> {
  const rows: LeaderboardRow[] = [];
  for (let skip = 0; ; ) {
    const response = await fetchJson<{ result: { data: { json: { evaluations: Evaluation[]; pagination: { total: number; hasMore: boolean } } } } }>(primeFeed(id, skip));
    const { evaluations, pagination } = response.result.data.json;
    for (const entry of evaluations) {
      if (!entry.environment_ids.includes(id)) throw new Error('Unexpected Prime Intellect environment');
      if (major !== undefined && !entry.semanticVersion) throw new Error('Missing environment version');
      if (major !== undefined && Number(entry.semanticVersion!.split('.')[0]) !== major) continue;
      if (entry.statistics.avgReward === null) continue;
      const meta = entry.metadata, publisher = entry.team ?? entry.user;
      if (!meta.model || !entry._id || !Number.isFinite(entry.statistics.avgReward)) throw new Error('Invalid Prime Intellect evaluation');
      rows.push({ model: meta.model, score: entry.statistics.avgReward, link: page + '/' + entry._id,
        date: meta.date ?? entry.created_at?.slice(0, 10), trials: meta.rollouts_per_example, setting: meta.sampling_args?.reasoning_effort,
        submitter: publisher?.slug ?? publisher?.name, harness: meta.framework, tokens: meta.usage?.output_tokens,
        cost: meta.cost?.total_usd !== undefined && entry.statistics.totalResults > 0 ? meta.cost.total_usd / entry.statistics.totalResults : undefined,
        metrics: { ...meta.avg_metrics, ...(typeof meta.time === 'number' ? { runSeconds: meta.time } : {}),
          ...(meta.num_examples && meta.num_examples > 0 ? { examples: meta.num_examples } : {}) } });
    }
    skip += evaluations.length;
    if (!pagination.hasMore) {
      if (skip !== pagination.total) throw new Error('Incomplete Prime Intellect result set');
      break;
    }
    if (!evaluations.length) throw new Error('Empty Prime Intellect results page');
    await new Promise(resolve => setTimeout(resolve, 1050));
  }
  if (rows.length < minimum) throw new Error('Missing scored evaluations');
  return rows;
}
const id = 'yv4pux6ewjrwcks8aqr8dugq';
const page = 'https://app.primeintellect.ai/dashboard/environments/primeintellect/llm-writer-negative-style/evals';
const board: Leaderboard = {
  benchmark: 'llm-writer-negative-style-prime', url: page, feed: primeFeed(id), terms: primeTerms,
  async fetch() {
    const rows = await primeRows(id, page, 1);
    return rows.map(({ metrics, ...rest }) => {
      if (!metrics) return rest;
      const { examples: _examples, ...keep } = metrics;
      return Object.keys(keep).length ? { ...rest, metrics: keep } : rest;
    });
  },
};
export default board;
