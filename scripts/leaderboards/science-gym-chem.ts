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
  final_answer_accuracy: { name: 'Final answer accuracy', unit: 'score', better: 'higher' },
  field_accuracy: { name: 'Field accuracy', unit: 'score', better: 'higher' },
  regret_score: { name: 'Regret score', unit: 'score', better: 'higher' },
  required_tools_used: { name: 'Required tools used', unit: 'score', better: 'higher' },
  workflow_efficiency: { name: 'Workflow efficiency', unit: 'score', better: 'higher' },
  screened_selected: { name: 'Screened selected', unit: 'score', better: 'higher' },
  campaign_budget_respected: { name: 'Campaign budget respected', unit: 'score', better: 'higher' },
  steps: { name: 'Mean turns', unit: 'count' },
  total_tool_calls: { name: 'Total tool calls', unit: 'count' },
  rank_compounds_calls: { name: 'Rank compounds calls', unit: 'count' },
  run_reaction_screen_calls: { name: 'Run reaction screen calls', unit: 'count' },
  compare_compounds_calls: { name: 'Compare compounds calls', unit: 'count' },
  submit_decision_calls: { name: 'Submit decision calls', unit: 'count' },
  inputTokens: { name: 'Mean input tokens', unit: 'tokens' },
  outputTokens: { name: 'Mean output tokens', unit: 'tokens' },
};
const CONSTANT_CALLS = new Set(['inspect_problem_calls', 'list_candidate_compounds_calls']);
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
          if (CONSTANT_CALLS.has(key)) continue;
          const metric = key === 'num_turns' ? 'steps' : key;
          metrics[metric] = value;
        }
        if (m.usage) Object.assign(metrics, { inputTokens: m.usage.input_tokens, outputTokens: m.usage.output_tokens });
        const tokens = m.usage && Number.isFinite(m.usage.output_tokens) && m.usage.output_tokens > 0 ? m.usage.output_tokens : undefined;
        rows.push({ model: m.model, score: e.statistics.avgReward, setting: settings.join(', '), harness: e.framework, trials: m.rollouts_per_example,
          tokens, date: e.createdAt.slice(0,10), metrics, submitter: e.user?.name, link: url + '/' + e._id });
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
