// WitnessBench v2.0. witnessbench.ai renders its leaderboard table from /data/witnessbench-v2.0.csv: per model
// the reasoning effort, OAE-L20 (optimal action efficiency over 20 levels, 0 to 100, the page's first
// metric and sort), levels beaten, cost per game and output tokens per game. OAE-L20 is the score and effort
// the setting. A game is one task, so cost and output tokens per game are kept. Metrics keep the table's
// OAE-L20 standard deviation ("sd"), LLM calls per game ("llmCalls") and actions per beaten level
// ("actions"). The board's chart plots OAE-L20 against a chosen per-game measure; its LLM-calls view is
// declared here (the cost view is drawn from the cost).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://witnessbench.ai/data/witnessbench-v2.0.csv';

const board: Leaderboard = {
  benchmark: 'witnessbench',
  url: 'https://witnessbench.ai/',
  feed: `${FEED} (oae_l20)`,
  terms: 'CSV the witnessbench.ai page loads; robots.txt allows all paths and the site states no terms.',
  aliases: {
    // the only Muse Glimmer in the registry
    'Muse Glimmer 30B': 'muse-glimmer',
  },
  chart: {
    title: 'Model Evals, LLM calls view',
    note: 'Each point is one model: its OAE-L20 score against the LLM calls it makes per game, on a log scale.',
    x: { key: 'llmCalls', label: 'LLM calls per game', better: 'lower', log: true },
    y: { key: 'score', label: 'OAE-L20', better: 'higher' },
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.oae_l20);
      if (!r.model || !Number.isFinite(score)) continue;
      const cost = Number(r.cost_per_game_usd);
      const tokens = Number(r.output_tokens_per_game);
      const metrics: Record<string, number> = {};
      for (const [k, v] of [
        ['sd', r.oae_l20_std],
        ['llmCalls', r.llm_calls_per_game],
        ['actions', r.actions_per_beaten_level],
      ] as const)
        if (v !== undefined && v !== '' && Number.isFinite(Number(v))) metrics[k] = Number(v);
      rows.push({
        model: r.model.trim(),
        score,
        setting: r.reasoning_effort || undefined,
        cost: Number.isFinite(cost) ? cost : undefined,
        tokens: Number.isFinite(tokens) ? tokens : undefined,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};
export default board;
