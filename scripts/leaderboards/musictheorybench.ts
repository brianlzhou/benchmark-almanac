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
  async fetch() {
    return musicResults(board, 'music_theory_bench', 15);
  },
};
export default board;
