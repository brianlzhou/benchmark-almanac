// Terminal-Bench-Science 0.1. terminal-bench-science.ai renders its leaderboard from the same Harbor Hub
// registry as tbench.ai: package "terminal-bench-science/terminal-bench-science", leaderboard "v0-1-eval".
// The site proxies it through /api/leaderboard, which its robots.txt disallows, so the importer calls the
// public Harbor Hub endpoint that the Terminal-Bench importers use (see terminal-bench-4-0.ts). Metrics
// per row: accuracy (0 to 100, the score), trial count ("tasks"), total cost and total tokens for the run.
// Cost per task is the total cost over the trial count. Total tokens include input, so they stay in metrics as run totals and totals per task.
// accuracy_stderr, the standard error the board prints as "+/- 3.2%", is kept as metrics.sem (points).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { HARBOR_FEED, label, type Link } from './terminal-bench-4-0.ts';

const PACKAGE = 'terminal-bench-science/terminal-bench-science';
const NAME = 'v0-1-eval';

interface Row {
  status?: string;
  metadata: { agent_display?: Link; model_display?: Link; reasoning_effort?: string; date?: string };
  metrics: { accuracy?: number; tasks?: number; total_cost_usd?: number; total_tokens?: number; accuracy_stderr?: number };
}

const board: Leaderboard = {
  benchmark: 'terminal-bench-science',
  url: 'https://www.terminal-bench-science.ai/',
  feed: `${HARBOR_FEED} (POST {"package":"${PACKAGE}","name":"${NAME}"})`,
  terms:
    'Public, unauthenticated Harbor Hub endpoint behind the site, under the Harbor Hub Terms of Service; the site robots.txt disallows only its own /api/ proxy, and the repository is Apache-2.0.',
  aliases: {},
  async fetch() {
    const body = JSON.stringify({ package: PACKAGE, name: NAME });
    const res = JSON.parse(await fetchText(HARBOR_FEED, { method: 'POST', headers: { 'content-type': 'application/json' }, body })) as { rows: Row[] };
    const out: LeaderboardRow[] = [];
    for (const r of res.rows) {
      if (r.status && r.status !== 'display') continue;
      const model = label(r.metadata.model_display);
      if (!model || /^multiple$/i.test(model)) continue;
      const { accuracy, tasks, total_cost_usd: total, accuracy_stderr: sem, total_tokens: totalTokens } = r.metrics;
      const metrics: Record<string, number> = {};
      if (typeof sem === 'number') metrics.sem = sem;
      if (typeof tasks === 'number' && tasks > 0) metrics.trials = tasks;
      if (typeof totalTokens === 'number' && totalTokens >= 0) {
        metrics.tokensTotal = totalTokens;
        if (tasks && tasks > 0) metrics.tokensTotalPerTask = totalTokens / tasks;
      }
      out.push({
        model,
        score: Number(accuracy),
        setting: r.metadata.reasoning_effort?.toLowerCase() || undefined,
        harness: label(r.metadata.agent_display),
        date: r.metadata.date,
        cost: tasks && total ? total / tasks : undefined,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return out;
  },
};
export default board;
