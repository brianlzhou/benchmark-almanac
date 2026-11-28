// MAPP (Multi-Agent Path Planning) reports mean reward for each evaluation in the Prime Intellect dashboard.
import type { Leaderboard } from "./types.ts";
import { primeFeed, primeRows, primeTerms } from "./gpu-puzzles.ts";

const env = "bsgg4e7fsa4pwytqs63os6ww";
const board: Leaderboard = {
  benchmark: "mapp-salty-duck",
  url: "https://app.primeintellect.ai/dashboard/environments/salty-duck/MAPP/evals",
  feed: primeFeed(env),
  terms: primeTerms,
  stats: {
    collision_penalty: { name: 'Collision penalty', unit: 'score', better: 'higher', note: 'Negative reward penalty for collisions, where values closer to 0 are better.' },
    progress_reward: { name: 'Progress reward', unit: 'score', better: 'higher' },
    success_reward: { name: 'Success reward', unit: 'score', better: 'higher' },
  },
  fetch() { return primeRows(this.url, env, 100, 1); },
};
export default board;
