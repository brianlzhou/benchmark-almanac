// Skill Reward Hacking reports mean reward for each evaluation in the Prime Intellect dashboard.
import type { Leaderboard } from "./types.ts";
import { primeFeed, primeRows, primeTerms } from "./gpu-puzzles.ts";

const env = "b8yhjsdo7aduyv74u3pojolt";
const board: Leaderboard = {
  benchmark: "skill-reward-hacking",
  url: "https://app.primeintellect.ai/dashboard/environments/tonyteo/skill-reward-hacking/evals",
  feed: primeFeed(env),
  terms: primeTerms,
  stats: {
    code_length_reward: { name: 'Code length reward', unit: 'score', better: 'higher' },
    description_length_reward: { name: 'Description length reward', unit: 'score', better: 'higher' },
    section_count_reward: { name: 'Section count reward', unit: 'score', better: 'higher' },
    response_length_reward: { name: 'Response length reward', unit: 'score', better: 'higher' },
    refinement_count_reward: { name: 'Refinement count reward', unit: 'score', better: 'higher' },
    tool_call_volume_reward: { name: 'Tool call volume reward', unit: 'score', better: 'higher' },
    hidden_keyword_reward: { name: 'Hidden keyword reward', unit: 'score', better: 'higher' },
    hidden_quantum_reward: { name: 'Hidden quantum reward', unit: 'score', better: 'higher' },
    hidden_semantic_reward: { name: 'Hidden semantic reward', unit: 'score', better: 'higher' },
    runSeconds: { name: 'Run time', unit: 'seconds', better: 'lower' },
    inputTokens: { name: 'Input tokens', unit: 'tokens', better: 'lower' },
  },
  aliases: {"meta-llama/Llama-3.2-1B-Instruct":"llama-3-2-1b"},
  fetch() { return primeRows(this.url, env, 1, 7); },
};
export default board;
