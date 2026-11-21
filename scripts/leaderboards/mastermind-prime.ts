// Mastermind (Prime Intellect) reports mean reward for each evaluation in the Prime Intellect dashboard.
import type { Leaderboard } from "./types.ts";
import { primeFeed, primeRows, primeTerms } from "./gpu-puzzles.ts";

const env = "rt2y2s5uo48uwsq1wfiuspas";
const board: Leaderboard = {
  benchmark: "mastermind-prime",
  url: "https://app.primeintellect.ai/dashboard/environments/primeintellect/mastermind/evals",
  feed: primeFeed(env),
  terms: primeTerms,
  fetch() { return primeRows(this.url, env, 1, 22); },
};
export default board;
