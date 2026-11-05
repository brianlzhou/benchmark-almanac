// ProfBench (NVIDIA). The nvidia/ProfBench Space opens on its Report Generation leaderboard, built from
// report_generation.jsonl in the Space repository and sorted by Overall: the share of expert rubric criteria
// a model's reports meet, judged by an LLM grader (0 to 100). Overall is the score. "Output Tokens" is the
// mean output length of one report and is kept as tokens. "Cost" is the board's US-dollar estimate for the
// whole run of 160 reports (OpenRouter token prices times the run's tokens), kept as cost with costPer 'run'.
// The "with documents" variant and the LLM Judge tab are other measures and are not
// read. Names carry the vendor and the reasoning effort ("OpenAI/GPT-5 (high)"), which the resolver splits.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/nvidia/ProfBench/resolve/main/report_generation.jsonl';

interface Row {
  Model?: string;
  Overall?: number;
  'Output Tokens'?: number;
  Cost?: number;
}

const board: Leaderboard = {
  benchmark: 'profbench',
  url: 'https://huggingface.co/spaces/nvidia/ProfBench',
  feed: `${FEED} (Overall)`,
  terms: 'JSON lines file in the nvidia/ProfBench Hugging Face Space, licensed MIT.',
  costPer: 'run',
  // keys without the vendor prefix, so they also apply after the resolver splits off "(Thinking)"
  aliases: {
    // the stable releases: the board names the September 2025 previews "-Preview-09-2025" when it has them
    'Gemini-2.5-Flash': 'gemini-2-5-flash-jun-2025',
    'Gemini-2.5-Flash-Lite': 'gemini-2-5-flash-lite-jun-2025',
    'grok-4-0709': 'grok-4',
    'grok-4.20 Beta': 'grok-4-20',
    'Qwen3-235B-A22B-Instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'Qwen3-30B-A3B-Instruct-2507': 'qwen3-30b-a3b-instruct-jul-2025',
    'Qwen3-30B-A3B-Thinking-2507': 'qwen3-30b-a3b-thinking-jul-2025',
    M2: 'minimax-m2',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const line of (await fetchText(FEED)).split('\n')) {
      if (!line.trim()) continue;
      const r = JSON.parse(line) as Row;
      if (!r.Model || typeof r.Overall !== 'number') continue;
      rows.push({ model: r.Model.trim(), score: r.Overall, tokens: r['Output Tokens'], cost: typeof r.Cost === 'number' ? r.Cost : undefined });
    }
    return rows;
  },
};
export default board;
