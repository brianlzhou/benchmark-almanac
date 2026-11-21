// Synthetic Sheet Music Reasoning Benchmark reports accuracy in MuTheoryEval's published model runs. The leaderboard JSON supplies fractional scores and run metadata.
import type { Leaderboard } from './types.ts';
import { musicResults } from './cmi-bench.ts';

const feed = "https://thevertexlab.github.io/MuTheoryEval/data.json";
const board: Leaderboard = {
  benchmark: 'ssmr-bench',
  url: "https://thevertexlab.github.io/MuTheoryEval/",
  feed,
  terms: "The host has no robots file. The runner repository uses the MIT License. https://raw.githubusercontent.com/thevertexlab/MuTheoryEval/main/LICENSE",
  host: 'MuTheoryEval',
  costPer: 'run',
  async fetch() {
    return musicResults(board, 'ssmr_bench', 15);
  },
};
export default board;
