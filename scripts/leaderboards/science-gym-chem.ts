// Models screen simulated compounds and decide whether to advance them.
// The Prime dashboard reports mean reward for each published evaluation, with its sample size.
import type { Leaderboard, LeaderboardRow, BoardStat } from './types.ts';
import { primeFeed } from './gpu-puzzles.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const env = 'rmy3kpg02p1qjcdnayudlyyq';
const url = 'https://app.primeintellect.ai/dashboard/environments/allan/science-gym-chem/evals';
interface Evaluation {
  _id: string; name: string; semanticVersion: string; framework?: string; createdAt: string;
  user?: { name: string }; statistics: { avgReward: number | null };
  metadata: { model: string; num_examples: number; rollouts_per_example: number;
    env_args?: { curriculum?: string; max_turns?: number; seed?: number };
    avg_metrics?: Record<string, number>; usage?: { input_tokens: number; output_tokens: number } };
}
const stats: Record<string, BoardStat> = {
  steps: {name: 'Mean turns', unit: 'count'}, inputTokens: {name: 'Mean input tokens', unit: 'tokens'},
  outputTokens: {name: 'Mean output tokens', unit: 'tokens'},
};
const board: Leaderboard = {
  benchmark: 'science-gym-chem', url, feed: primeFeed(env), stats,
  terms: 'Prime Intellect hosts the public evaluations under https://www.primeintellect.ai/terms-of-service.',
  async fetch() {
    const rows: LeaderboardRow[] = [];
    let skip = 0;
    for (;;) {
      const payload = await fetchJson<{ result: { data: { json: { evaluations: Evaluation[], pagination: { total: number, hasMore: boolean } } } } }>(primeFeed(env, skip));
      const { evaluations, pagination } = payload.result.data.json;
      for (const e of evaluations) {
        if (e.statistics.avgReward === null) continue;
        const m = e.metadata;
        const args = m.env_args;
        const settings = [e.semanticVersion, m.num_examples + ' examples'];
        if (args?.curriculum) settings.push(args.curriculum + ' curriculum', 'seed ' + args.seed, args.max_turns + ' turns');
        else if (e.name.endsWith('hard-smoke')) settings.push('Hard smoke test');
        const metrics: Record<string, number> = {};
        for (const [key, value] of Object.entries(m.avg_metrics ?? {})) {
          if (!Number.isFinite(value)) throw new Error('Invalid chemistry metric ' + key);
          const metric = key === 'num_turns' ? 'steps' : key;
          metrics[metric] = value;
          stats[metric] ??= { name: key.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase()), unit: key.endsWith('calls') ? 'count' : 'score' };
        }
        if (m.usage) Object.assign(metrics, { inputTokens: m.usage.input_tokens, outputTokens: m.usage.output_tokens });
        rows.push({ model: m.model, score: e.statistics.avgReward, setting: settings.join(', '), harness: e.framework, trials: m.rollouts_per_example,
          date: e.createdAt.slice(0,10), metrics, submitter: e.user?.name, link: url + '/' + e._id });
      }
      skip += evaluations.length;
      if (!pagination.hasMore) {
        if (skip !== pagination.total) throw new Error('Incomplete chemistry evaluation list');
        return checked(rows, 12);
      }
      if (!evaluations.length) throw new Error('Empty chemistry evaluation page');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  },
};
export default board;
