// Pico DSL v0 (oso on Prime Intellect Environments Hub).
// Tests models on writing programs in a compact domain-specific language. Reads all completed public
// evaluations from Prime Intellect's public MongoDB evaluation endpoint. The headline score is mean reward
// scaled to percent (0 to 100), with format validity, pass@k, pass^k, input tokens, run time and turns in stats.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { primeFeed, primeTerms } from './gpu-puzzles.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const ENV = 't18ay6kgi1tqxembua50e4i5';
const URL = 'https://app.primeintellect.ai/dashboard/environments/oso/pico-dsl-v0/evals';

interface Eval {
  _id: string;
  status: string;
  model_name?: string;
  framework?: string;
  semanticVersion?: string;
  createdAt?: string;
  team?: { name?: string; slug?: string };
  user?: { name?: string; slug?: string };
  statistics?: { avgReward?: number | null };
  metadata?: {
    model?: string;
    num_examples?: number;
    rollouts_per_example?: number;
    time?: number;
    env_args?: { difficulty?: string };
    avg_metrics?: { exact_match?: number; format_valid?: number; num_turns?: number };
    pass_at_k?: Record<string, number>;
    pass_all_k?: Record<string, number>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
}

const board: Leaderboard = {
  benchmark: 'pico-dsl-v0',
  url: URL,
  feed: primeFeed(ENV),
  terms: primeTerms,
  headline: 'Public Prime Intellect evaluations span tiny, easy and hard difficulty splits. Only the common tiny split is kept here so all models are compared on the same tasks.',
  aliases: {
    'nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B': 'nemotron-3-ultra',
    'nvidia/nemotron-3-super-120b-a12b': 'nemotron-3-super',
    'mistralai/mistral-small-3.2-24b-instruct': 'mistral-small-3-2',
    'meta-llama/Llama-3.2-3B-Instruct': 'llama-3-2-3b',
  },
  stats: {
    formatValid: { name: 'Format valid rate', unit: '%', better: 'higher' },
    passAt1: { name: 'pass@1', unit: '%', better: 'higher' },
    passAt2: { name: 'pass@2', unit: '%', better: 'higher' },
    passAt4: { name: 'pass@4', unit: '%', better: 'higher' },
    passAt8: { name: 'pass@8', unit: '%', better: 'higher' },
    pass1: { name: 'pass^1', unit: '%', better: 'higher' },
    pass2: { name: 'pass^2', unit: '%', better: 'higher' },
    pass4: { name: 'pass^4', unit: '%', better: 'higher' },
    pass8: { name: 'pass^8', unit: '%', better: 'higher' },
    inputTokens: { name: 'Mean input tokens', unit: 'tokens', better: 'lower' },
    runSeconds: { name: 'Run time', unit: 'seconds', better: 'lower' },
    steps: { name: 'Mean turns', unit: 'count' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = [];
    for (let skip = 0; ; skip += 100) {
      const payload = await fetchJson<{
        result: { data: { json: { evaluations: Eval[]; pagination: { total: number; hasMore: boolean } } } };
      }>(primeFeed(ENV, skip));
      const { evaluations, pagination } = payload.result.data.json;
      for (const e of evaluations) {
        if (e.status !== 'COMPLETED') continue;
        const reward = e.statistics?.avgReward;
        const m = e.metadata;
        if (m?.env_args?.difficulty !== 'tiny') continue;
        const model = m?.model || e.model_name;
        if (!model || reward === null || reward === undefined || !Number.isFinite(reward)) continue;

        const metrics: Record<string, number> = {};
        if (typeof m?.avg_metrics?.format_valid === 'number') metrics.formatValid = m.avg_metrics.format_valid * 100;
        if (typeof m?.avg_metrics?.num_turns === 'number') metrics.steps = m.avg_metrics.num_turns;
        for (const k of ['1', '2', '4', '8'] as const) {
          const pa = m?.pass_at_k?.[k];
          if (typeof pa === 'number' && Number.isFinite(pa)) metrics[`passAt${k}`] = pa * 100;
          const pk = m?.pass_all_k?.[k];
          if (typeof pk === 'number' && Number.isFinite(pk)) metrics[`pass${k}`] = pk * 100;
        }
        if (typeof m?.usage?.input_tokens === 'number' && m.usage.input_tokens > 0) metrics.inputTokens = Math.round(m.usage.input_tokens);
        if (typeof m?.time === 'number' && m.time > 0) metrics.runSeconds = m.time;

        const settingParts = [
          m?.env_args?.difficulty ? `${m.env_args.difficulty} split` : '',
          m?.num_examples ? `${m.num_examples} examples` : '',
          e.semanticVersion ? `v${e.semanticVersion}` : '',
        ].filter(Boolean);

        rows.push({
          model,
          score: reward * 100,
          harness: e.framework || undefined,
          setting: settingParts.join(', ') || undefined,
          trials: m?.rollouts_per_example,
          tokens: typeof m?.usage?.output_tokens === 'number' && m.usage.output_tokens > 0 ? m.usage.output_tokens : undefined,
          date: e.createdAt?.slice(0, 10),
          submitter: e.team?.name || e.team?.slug || e.user?.name || e.user?.slug,
          link: `${URL}/${e._id}`,
          metrics,
        });
      }
      if (!pagination.hasMore) {
        if (skip + evaluations.length !== pagination.total) throw new Error('Incomplete Pico DSL pagination');
        break;
      }
      await new Promise((r) => setTimeout(r, 1050));
    }
    return checked(rows, 10);
  },
};

export default board;
