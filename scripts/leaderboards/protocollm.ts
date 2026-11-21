// RTLBench measures how often generated ProtocolLLM designs pass its syntax check.
// The baseline CSV reports the lint pass rate on nine public prompts.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/ArmmyC/RTLBench/main/reports/baseline_v0.1_public_rtl_benchmarks.csv";

const board: Leaderboard = {
  benchmark: "protocollm",
  url: "https://github.com/ArmmyC/RTLBench/blob/main/reports/baseline_v0.1_public_rtl_benchmarks.md",
  feed,
  terms: "The repository gives no explicit license for redistributing the score table. The host has no robots.txt.",
  host: "RTLBench",
  aliases: {"qwen36-27b": "qwen3-6-27b", "qwen36-35b-a3b": "qwen-3-6-35b-a3b", "qwen25-coder-32b": "qwen2-5-coder-32b-instruct"},
  async fetch() {
    const rows = parseCsv(await fetchText(feed)).filter(r => r.benchmark === 'protocollm' && r.baseline === 'baseline_v0_1' && r.metric === 'syntax_pass_rate' && r.mode === 'lint');
    if (rows.length < 5) throw new Error('Incomplete ProtocolLLM standings');
    return rows.map(r => {
      if (!r.model || !r.value || !Number.isFinite(Number(r.value))) throw new Error('Invalid syntax pass rate');
      return { model: r.model, score: Number(r.value) * 100, setting: 'Lint only' };
    });
  },
};
export default board;
