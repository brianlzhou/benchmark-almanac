// WildScore reports accuracy in MuTheoryEval's published model runs. The leaderboard JSON supplies fractional scores and run metadata.
import type { Leaderboard } from './types.ts';
import { musicResults } from './cmi-bench.ts';

const feed = "https://thevertexlab.github.io/MuTheoryEval/data.json";
const board: Leaderboard = {
  benchmark: 'wildscore',
  url: "https://thevertexlab.github.io/MuTheoryEval/",
  feed,
  terms: "The host has no robots file. The runner repository uses the MIT License. https://raw.githubusercontent.com/thevertexlab/MuTheoryEval/main/LICENSE",
  stats: { questions: {name: 'Questions', unit: 'count'}, correct: {name: 'Correct answers', unit: 'count', better: 'higher'}, wrong: {name: 'Wrong answers', unit: 'count', better: 'lower'}, format_error: {name: 'Format errors', unit: 'count', better: 'lower'}, total_prompt_tokens: {name: 'Total prompt tokens', unit: 'tokens'}, total_completion_tokens: {name: 'Total completion tokens', unit: 'tokens'}, elapsedSeconds: {name: 'Elapsed time', unit: 'seconds', better: 'lower'}, total_thinking_tokens: {name: 'Total thinking tokens', unit: 'tokens'}, avg_thinking_tokens_per_q: {name: 'Average thinking tokens per question', unit: 'tokens', better: 'lower'} },
  host: 'MuTheoryEval',
  costPer: 'run',
  async fetch() {
    return musicResults(board, 'wildscore', 9);
  },
};
export default board;
