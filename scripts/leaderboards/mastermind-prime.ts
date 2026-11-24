// Mastermind (Prime Intellect) reports mean reward for each evaluation in the Prime Intellect dashboard.
import type { Leaderboard } from "./types.ts";
import { primeFeed, primeRows, primeTerms } from "./gpu-puzzles.ts";

const env = "rt2y2s5uo48uwsq1wfiuspas";
const board: Leaderboard = {
  benchmark: "mastermind-prime",
  url: "https://app.primeintellect.ai/dashboard/environments/primeintellect/mastermind/evals",
  feed: primeFeed(env),
  terms: primeTerms,
  stats: {
    solved_reward: { name: 'Solved reward', unit: 'score', better: 'higher' },
    partial_feedback_reward: { name: 'Partial feedback reward', unit: 'score', better: 'higher' },
    candidate_reduction_reward: { name: 'Candidate reduction reward', unit: 'score', better: 'higher' },
    speed_reward: { name: 'Speed reward', unit: 'score', better: 'higher' },
    format_reward_func: { name: 'Format reward', unit: 'score', better: 'higher' },
    runSeconds: { name: 'Run time', unit: 'seconds', better: 'lower' },
  },
  fetch() { return primeRows(this.url, env, 1, 22); },
};
export default board;
