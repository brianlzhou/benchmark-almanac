// Models solve seven-by-seven Slitherlink puzzles. The board gives mean reward for a complete ten-board run.
// Select the seven-by-seven hard variant using the run's explicit configuration or its published name.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { primeFeed } from './gpu-puzzles.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const env = 'djqny3ye7fjerzpu25cmzk56';
const url = 'https://app.primeintellect.ai/dashboard/environments/savi/slitherlink-env/evals';
interface Run {
  _id: string, name: string, status: string, model_name: string, framework: string, createdAt: string,
  statistics: {avgReward: number, totalResults: number}, detailedMetrics: {metricsStats: Record<string,{mean: number}>},
  metadata: { num_examples: number, rollouts_per_example: number, env_args?: {dataset_variant?: string, max_turns?: number},
    sampling_args?: {reasoning_effort?: string, extra_body?: {chat_template_kwargs?: {enable_thinking?: boolean}}},
    usage?: {input_tokens: number, output_tokens: number}, time_ms?: number },
}
const board: Leaderboard = {
  benchmark: 'slitherlink-env', url, feed: primeFeed(env),
  terms: 'Prime Intellect publishes these evaluations under its terms. https://www.primeintellect.ai/terms-of-service',
  stats: {
    board_solved_score: { name: 'Board solved score', unit: 'score' }, clue_score: { name: 'Clue satisfaction', unit: 'score' },
    connectivity_score: { name: 'Connectivity', unit: 'score' }, vertex_score: { name: 'Vertex validity', unit: 'score' },
    edge_accuracy_score: { name: 'Edge accuracy', unit: 'score' }, runSeconds: { name: 'Run time', unit: 'seconds', better: 'lower' },
    inputTokens: { name: 'Mean input tokens', unit: 'tokens' }, outputTokens: { name: 'Mean output tokens', unit: 'tokens' },
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (let skip = 0; ; skip += 100) {
      const page = await fetchJson<{result:{data:{json:{evaluations: Run[], pagination:{hasMore:boolean, total:number}}}}}>(primeFeed(env,skip));
      const { evaluations, pagination } = page.result.data.json;
      for (const e of evaluations) {
        const m = e.metadata;
        if (e.status !== 'COMPLETED' || (m.env_args?.dataset_variant ?? (/7x7.hard/i.test(e.name) ? '7x7-hard' : '')) !== '7x7-hard') continue;
        if (m.num_examples !== 10 || e.statistics.totalResults !== 10 * m.rollouts_per_example) continue;
        if (!e.model_name || !Number.isFinite(e.statistics.avgReward)) throw new Error('Missing Slitherlink result');
        const settings = ['7x7 hard'];
        if (m.env_args?.max_turns) settings.push(m.env_args.max_turns + ' turns');
        if (m.sampling_args?.reasoning_effort) settings.push(m.sampling_args.reasoning_effort + ' reasoning');
        if (m.sampling_args?.extra_body?.chat_template_kwargs?.enable_thinking === false) settings.push('thinking disabled');
        const metrics = Object.fromEntries(Object.entries(e.detailedMetrics.metricsStats).map(([k,v]) => [k,v.mean]));
        if (m.time_ms !== undefined) metrics.runSeconds = m.time_ms / 1000;
        if (m.usage) { metrics.inputTokens = m.usage.input_tokens; metrics.outputTokens = m.usage.output_tokens; }
        const tokens = m.usage && Number.isFinite(m.usage.output_tokens) && m.usage.output_tokens > 0 ? m.usage.output_tokens : undefined;
        rows.push({ model: e.model_name, score: e.statistics.avgReward, harness: e.framework, setting: settings.join(', '),
          tokens, date: e.createdAt.slice(0,10), trials: m.rollouts_per_example, metrics, link: url + '/' + e._id });
      }
      if (!pagination.hasMore) {
        if (skip + evaluations.length !== pagination.total) throw new Error('Incomplete Slitherlink results');
        break;
      }
      if (evaluations.length !== 100) throw new Error('Missing Slitherlink page');
      await new Promise(resolve => setTimeout(resolve, 1050));
    }
    return checked(rows, 2);
  },
};
export default board;
