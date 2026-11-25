// Harbor reports pass@2 through pass@5 alongside single-trial accuracy.
// Enterprise-Bench v2 scores agents on 42 enterprise tasks. Accuracy is the percentage of successful trials.
// Harbor's leaderboard tab requests its rows from a public server action on the dataset page.
import type { Leaderboard } from './types.ts';
import { harborMetricKey } from './enterprise-bench-l1-l2.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://hub.harborframework.com/datasets/Enterprise-Bench/l1-l2-bench-v2?tab=leaderboard';
interface Entry {
  id: string;
  metadata: { model_display_name: string; agent_display_name: string; agent_org_display_name: string };
  metrics: Record<string, number | string> & { accuracy: number; n_trials: number; total_cost_usd: number };
  created_at: string;
}
const board: Leaderboard = {
  benchmark: 'enterprise-bench-l1-l2-v2', url, feed: url,
  terms: 'Public leaderboard on Harbor Hub, subject to Harbor’s terms.',
  harnesses: 'system',
  costPer: 'run',
  stats: {
    passAt2: { name: 'pass@2', unit: 'score', better: 'higher', note: 'Pass rate from 0 to 1.' },
    passAt3: { name: 'pass@3', unit: 'score', better: 'higher', note: 'Pass rate from 0 to 1.' },
    passAt4: { name: 'pass@4', unit: 'score', better: 'higher', note: 'Pass rate from 0 to 1.' },
    passAt5: { name: 'pass@5', unit: 'score', better: 'higher', note: 'Pass rate from 0 to 1.' },
    runTotalTokens: { name: 'Total run tokens', unit: 'tokens' },
    runOutputTokens: { name: 'Total run output tokens', unit: 'tokens' },
    runCachedInputTokens: { name: 'Cached input tokens', unit: 'tokens' },
    runUncachedInputTokens: { name: 'Uncached input tokens', unit: 'tokens' },
    latency: { name: 'Average trial duration', unit: 'seconds', better: 'lower' },
  },
  async fetch() {
    const response = await fetchText(url, {
      method: 'POST',
      headers: { 'next-action': '40d4165d2db225603adb98bf66cbe6fee358edb2d4', 'content-type': 'text/plain;charset=UTF-8', accept: 'text/x-component' },
      body: JSON.stringify(['bd336a14-38ba-4d1d-bf1d-84a80f711420']),
    });
    const line = response.split('\n').find(s => s.startsWith('1:{'));
    if (!line) throw new Error('Harbor leaderboard response missing');
    const data = JSON.parse(line.slice(2));
    if (data.title !== 'Enterprise-Bench / L1-L2 Bench v2' || data.rows?.length < 2) throw new Error('Enterprise-Bench leaderboard changed');
    return (data.rows as Entry[]).map(row => {
      const { accuracy, n_trials, total_cost_usd, ...other } = row.metrics;
      if (!row.metadata.model_display_name || !Number.isFinite(accuracy) || !Number.isFinite(n_trials)) throw new Error('Incomplete Enterprise-Bench row');
      const outTok = typeof other.output_tokens === 'number' && Number.isFinite(other.output_tokens) ? other.output_tokens : undefined;
      return { model: row.metadata.model_display_name, score: accuracy, harness: row.metadata.agent_display_name,
        agentOrg: row.metadata.agent_org_display_name, trials: n_trials, cost: total_cost_usd,
        tokens: n_trials > 0 && outTok !== undefined ? outTok / n_trials : undefined,
        date: row.created_at.slice(0, 10), link: url.split('?')[0] + '/latest/leaderboards/main/rows/' + row.id,
        metrics: Object.fromEntries(Object.entries(other).filter((e): e is [string, number] => typeof e[1] === 'number').map(([key, value]) => [harborMetricKey(key), value])) };
    });
  },
};
export default board;
