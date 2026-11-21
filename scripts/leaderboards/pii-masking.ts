// PII Masking reports mean reward for each evaluation in the Prime Intellect dashboard.
import type { Leaderboard } from "./types.ts";
import { primeFeed, primeRows, primeTerms } from "./gpu-puzzles.ts";

const env = "a6syvt960o5cd2o69a5ygc8r";
const board: Leaderboard = {
  benchmark: "pii-masking",
  url: "https://app.primeintellect.ai/dashboard/environments/adamlucek/pii-masking/evals",
  feed: primeFeed(env),
  terms: primeTerms,
  stats: { exact_match_reward: { name: 'Exact match reward', unit: 'score', better: 'higher' }, format_reward_func: { name: 'Format reward', unit: 'score', better: 'higher' }, pii_count_reward: { name: 'PII count reward', unit: 'score', better: 'higher' } },
  fetch() { return primeRows(this.url, env, 1, 7); },
};
export default board;
