// MANDOS Session 2 ranks logical models by their pass rate across held-out scenarios. RelayForge publishes counts and pass rates in its leaderboard JSON.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface Rate { pass_rate_pct: number; scored_n: number; scored_pass: number; score_counts: Record<string, number> }

const feed = "https://huggingface.co/datasets/relayforge-ai/mandos/raw/main/leaderboard_session2.json";
const board: Leaderboard = {
  benchmark: 'mandos-session-2',
  url: "https://huggingface.co/datasets/relayforge-ai/mandos/blob/main/leaderboard_session2.md",
  feed,
  terms: "Hugging Face allows crawling. RelayForge licenses published runs under CC BY 4.0. https://huggingface.co/datasets/relayforge-ai/mandos",
  aliases: {"claude-sonnet-46-or": "claude-sonnet-4-6", "deepseek-r1-or": "deepseek-r1", "kimi-cloud": "kimi-k2-6", "llama-33-70b-or": "llama-3-3-70b", "openai-gpt4o-mini": "gpt-4o-mini"},
  async fetch() {
    const data = await fetchJson<{matrix: {logical_models: string[]}; score_rates: {by_model: Record<string, Rate>}}>(feed);
    if (data.matrix.logical_models.length < 7) throw new Error('Incomplete Session 2 matrix');
    return data.matrix.logical_models.map(model => {
      const row = data.score_rates.by_model[model];
      if (!row || !Number.isFinite(row.pass_rate_pct) || !row.scored_n || !row.score_counts) throw new Error('Missing pass rate for ' + model);
      return { model, score: row.pass_rate_pct, trials: row.scored_n, metrics: { passed: row.scored_pass, ...row.score_counts } };
    });
  },
};
export default board;
