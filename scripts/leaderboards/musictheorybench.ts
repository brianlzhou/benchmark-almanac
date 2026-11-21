// MusicTheoryBench reports accuracy in MuTheoryEval's published model runs. The leaderboard JSON supplies fractional scores and run metadata.
import type { Leaderboard } from './types.ts';
import { musicResults } from './cmi-bench.ts';

const feed = "https://thevertexlab.github.io/MuTheoryEval/data.json";
const board: Leaderboard = {
  benchmark: 'musictheorybench',
  url: "https://thevertexlab.github.io/MuTheoryEval/",
  feed,
  terms: "The host has no robots file. The runner repository uses the MIT License. https://raw.githubusercontent.com/thevertexlab/MuTheoryEval/main/LICENSE",
  host: 'MuTheoryEval',
  costPer: 'run',
  stats: {
    questions: { name: 'Questions', unit: 'count' },
    seed: { name: 'Random seed', unit: 'count' },
    format_error: { name: 'Format errors', unit: 'count', better: 'lower' },
    wrong: { name: 'Wrong answers', unit: 'count', better: 'lower' },
    correct: { name: 'Correct answers', unit: 'count', better: 'higher' },
    total_prompt_tokens: { name: 'Total prompt tokens', unit: 'tokens' },
    total_completion_tokens: { name: 'Total completion tokens', unit: 'tokens' },
    elapsedSeconds: { name: 'Elapsed time', unit: 'seconds', better: 'lower' },
    total_thinking_tokens: { name: 'Total thinking tokens', unit: 'tokens' },
    avg_thinking_tokens_per_q: { name: 'Average thinking tokens per question', unit: 'tokens' },
  },
  async fetch() {
    return musicResults(board, 'music_theory_bench', 15);
  },
};
export default board;
