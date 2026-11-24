// Two agents cooperate as Codenames cluegiver and guesser. The board reports mean combined reward.
// The public evaluation list records self-play and names both models in the two mixed-model runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { primeFeed } from './gpu-puzzles.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const env = 'hbz0902b7pg8se354w0rl2g5';
const url = 'https://app.primeintellect.ai/dashboard/environments/maxbittker/codenames/evals';
interface Evaluation {
  _id: string, framework?: string, status: string, model_name: string, createdAt: string, total_samples: number, semanticVersion: string,
  user?: { name: string }, statistics: { avgReward: number },
  metadata: { env_args: { self_play?: boolean, guesser_model?: string }, rollouts_per_example: number,
    num_examples: number, time_ms?: number, usage?: { input_tokens: number, output_tokens: number } },
  detailedMetrics: { metricsStats: Record<string, {mean: number}> },
}
const board: Leaderboard = {
  benchmark: 'cooperative-codenames-bittker', url, feed: primeFeed(env),
  terms: 'Prime Intellect hosts these public runs under its terms. https://www.primeintellect.ai/terms-of-service',
  stats: {
    runSeconds: { name: 'Run time', unit: 'seconds' },
    samples: { name: 'Scored samples', unit: 'count' }, inputTokens: { name: 'Mean input tokens', unit: 'tokens' },
    outputTokens: { name: 'Mean output tokens', unit: 'tokens' }, game_reward: { name: 'Game reward', unit: 'score' },
    cluegiver_format_reward: { name: 'Cluegiver format reward', unit: 'score' },
    guesser_format_reward: { name: 'Guesser format reward', unit: 'score' }, shot_calling_reward: { name: 'Shot calling reward', unit: 'score' },
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (let skip = 0; ; skip += 100) {
      const payload = await fetchJson<{result: {data: {json: {
        evaluations: Evaluation[], pagination: {hasMore: boolean, total: number},
      }}}}>(primeFeed(env, skip));
      const { evaluations, pagination } = payload.result.data.json;
      for (const e of evaluations) {
        if (e.status !== 'COMPLETED') continue;
        const m = e.metadata;
        const args = m.env_args;
        if (!e.model_name || !Number.isFinite(e.statistics.avgReward) || (args.self_play === false && !args.guesser_model))
          throw new Error('Missing Codenames result or partner');
        const mode = args.self_play ? 'Self-play' : args.guesser_model ? 'Paired play' : 'Default setup';
        const metrics: Record<string, number> = { samples: e.total_samples };
        for (const [key, value] of Object.entries(e.detailedMetrics?.metricsStats ?? {})) metrics[key] = value.mean;
        if (m.time_ms !== undefined) metrics.runSeconds = m.time_ms / 1000;
        if (m.usage) { metrics.inputTokens = m.usage.input_tokens; metrics.outputTokens = m.usage.output_tokens; }
        rows.push({ model: e.model_name, models: args.guesser_model ? [e.model_name, args.guesser_model] : undefined,
          score: e.statistics.avgReward, harness: e.framework, setting: mode + ', ' + m.num_examples + ' boards, v' + e.semanticVersion,
          link: url + '/' + e._id, trials: m.rollouts_per_example, date: e.createdAt.slice(0,10), submitter: e.user?.name, metrics });
      }
      if (!pagination.hasMore) {
        if (skip + evaluations.length !== pagination.total) throw new Error('Incomplete Codenames board');
        break;
      }
      if (evaluations.length !== 100) throw new Error('Missing Codenames page');
      await new Promise(resolve => setTimeout(resolve, 1050));
    }
    return checked(rows, 12);
  },
};
export default board;
