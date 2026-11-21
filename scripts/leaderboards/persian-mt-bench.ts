// Persian MT-Bench grades multi-turn conversations. MIZAN identifies the unweighted mean as its main score and publishes category ratings in JSONL.
import type { Leaderboard } from './types.ts';
import { mizanAliases, mizanRows, mizanTerms } from './mizan-persian-llm-leaderboard.ts';

const feed = "https://huggingface.co/spaces/MCINext/mizan-llm-leaderboard/raw/main/leaderboard/boards_data/mt_bench.jsonl";
const fields = [
  "score_w_mean",
  "writing_score_w_mean",
  "writing_score_mean",
  "roleplay_score_w_mean",
  "roleplay_score_mean",
  "reasoning_score_w_mean",
  "reasoning_score_mean",
  "math_score_w_mean",
  "math_score_mean",
  "coding_score_w_mean",
  "coding_score_mean",
  "extraction_score_w_mean",
  "extraction_score_mean",
  "stem_score_w_mean",
  "stem_score_mean",
  "humanities_score_w_mean",
  "humanities_score_mean",
  "persian_general_knowledge_score_w_mean",
  "persian_general_knowledge_score_mean",
  "chatbot_rag_score_w_mean",
  "chatbot_rag_score_mean"
];
const sourceFields = Object.fromEntries(fields.map(k => [k,k]));
const board: Leaderboard = {
  benchmark: "persian-mt-bench", url: "https://mcinext-mizan-llm-leaderboard.hf.space/", feed, terms: mizanTerms, aliases: mizanAliases,
  parts: Object.fromEntries(fields.map(k => [k,k.replaceAll('_',' ')])),
  fetch: () => mizanRows(feed, "score_mean", sourceFields, 1, 45),
};
export default board;
