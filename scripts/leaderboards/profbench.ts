// ProfBench (NVIDIA). The nvidia/ProfBench Space opens on its Report Generation leaderboard, built from
// report_generation.jsonl in the Space repository and sorted by Overall: the share of expert rubric criteria
// a model's reports meet, judged by an LLM grader (0 to 100). Overall is the score. "Output Tokens" is the
// mean output length of one report and is kept as tokens. "Cost" is the price of the whole run, not of one
// task, so it is left out. The "with documents" variant and the LLM Judge tab are other measures and are not
// read. Names carry the vendor and the reasoning effort ("OpenAI/GPT-5 (high)"), which the resolver splits.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/nvidia/ProfBench/resolve/main/report_generation.jsonl';

interface Row {
  Model?: string;
  Overall?: number;
  'Output Tokens'?: number;
}

const board: Leaderboard = {
  benchmark: 'profbench',
  url: 'https://huggingface.co/spaces/nvidia/ProfBench',
  feed: `${FEED} (Overall)`,
  terms: 'JSON lines file in the nvidia/ProfBench Hugging Face Space, licensed MIT.',
  aliases: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const line of (await fetchText(FEED)).split('\n')) {
      if (!line.trim()) continue;
      const r = JSON.parse(line) as Row;
      if (!r.Model || typeof r.Overall !== 'number') continue;
      rows.push({ model: r.Model.trim(), score: r.Overall, tokens: r['Output Tokens'] });
    }
    return rows;
  },
};
export default board;
