// The Aggregate scores rating estimates by mean absolute error over 50 chess players. Its pilot JSON includes bootstrap intervals and costs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://theaggregate.ai/benchmarks/lichess-rating-pilot.json";

const board: Leaderboard = {
  benchmark: "the-aggregate-lichess-rating-prediction-25-games",
  url: "https://theaggregate.ai/benchmark?slug=the-aggregate-lichess-rating-prediction-25-games",
  feed,
  terms: "Credit The Aggregate when quoting scores. Bulk republication requires written permission. https://theaggregate.ai/terms The feed host publishes robots.txt at https://theaggregate.ai/robots.txt.",
  costPer: 'run',
  stats: { games:{name:'Games',unit:'count'}, estimates:{name:'Rating estimates',unit:'count'}, rmse:{name:'Root mean squared error',unit:'score',better:'lower'}, bias:{name:'Prediction bias',unit:'score'}, pearson:{name:'Pearson correlation',unit:'score',better:'higher'}, spearman:{name:'Spearman correlation',unit:'score',better:'higher'}, outputTokenLimit:{name:'Output token limit',unit:'tokens'} },
  async fetch() {
    type Model = { display_name: string; cost_usd: number; reasoning_effort: string; run_end: string; max_tokens: number;
      summary: { mae: number; mae_game_bootstrap_95_interval: [number, number]; games: number; player_estimates: number;
        rmse: number; signed_bias: number; pearson: number; spearman: number } };
    const { models } = await fetchJson<{ models: Model[] }>(feed);
    if (models.length < 19) throw new Error('Incomplete rating predictions');
    return models.map(r => {
      const s = r.summary;
      if (!r.display_name || !Number.isFinite(s.mae) || s.games !== 25) throw new Error('Invalid 25-game score');
      return { model: r.display_name, score: s.mae, low: s.mae_game_bootstrap_95_interval[0], high: s.mae_game_bootstrap_95_interval[1],
        setting: r.reasoning_effort, date: r.run_end, cost: r.cost_usd, metrics: { games: s.games, estimates: s.player_estimates,
          rmse: s.rmse, bias: s.signed_bias, pearson: s.pearson, spearman: s.spearman, outputTokenLimit: r.max_tokens } };
    });
  },
};
export default board;
