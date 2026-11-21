// Skill Reward Hacking reports mean reward for each evaluation in the Prime Intellect dashboard.
import type { Leaderboard } from "./types.ts";
import { primeFeed, primeRows, primeTerms } from "./gpu-puzzles.ts";

const env = "b8yhjsdo7aduyv74u3pojolt";
const board: Leaderboard = {
  benchmark: "skill-reward-hacking",
  url: "https://app.primeintellect.ai/dashboard/environments/tonyteo/skill-reward-hacking/evals",
  feed: primeFeed(env),
  terms: primeTerms,
  aliases: {"meta-llama/Llama-3.2-1B-Instruct":"llama-3-2-1b"},
  fetch() { return primeRows(this.url, env, 1, 7); },
};
export default board;
