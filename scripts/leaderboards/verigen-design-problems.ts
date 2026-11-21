// TuRTLe ranks Verilog module completions by their functional pass percentage. Its simulation CSV contains the VeriGen scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { turtleColumns } from './rtl-repo.ts';

const feed = "https://huggingface.co/spaces/HPAI-BSC/TuRTLe-Leaderboard/raw/main/src/data/results_icarus_november_2025.csv";

const board: Leaderboard = {
  benchmark: "verigen-design-problems",
  url: "https://huggingface.co/spaces/HPAI-BSC/TuRTLe-Leaderboard",
  feed,
  terms: "The leaderboard Space carries the Apache 2.0 license. https://huggingface.co/spaces/HPAI-BSC/TuRTLe-Leaderboard/blob/main/LICENSE The feed host publishes robots.txt at https://huggingface.co/robots.txt.",
  aliases: {"Qwen3 236B A22B": "qwen3-235b-a22b", "Llama 3.(1-3) 70B": "llama-3-3-70b-instruct", "Seed-OSS-36B": "seed-oss-36b-instruct", "Magistral Small 2506": "magistral-small-1-0", "QwenCoder 2.5 32B": "qwen2-5-coder-32b-instruct", "QwenCoder 2.5 14B": "qwen2-5-coder-14b-instruct", "DeepSeek R1": "deepseek-r1", "GLM-5-FP8": "glm-5"},
  host: "TuRTLe",
  async fetch() {
    const rows = await turtleColumns(feed, 'VeriGen', 'Functionality (FNC)', 45);
    return rows.map(r => r.model.endsWith('-FP8') ? { ...r, setting: 'FP8' } : r);
  },
};
export default board;
