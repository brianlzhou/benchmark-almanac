// TuRTLe reports functional simulation pass rates on VerilogEval specification-to-RTL tasks.
// The Icarus results CSV also reports syntax, synthesis, power, performance and area.
import type { Leaderboard } from './types.ts';
import { turtleColumns } from './rtl-repo.ts';

const feed = "https://huggingface.co/spaces/HPAI-BSC/TuRTLe-Leaderboard/raw/main/src/data/results_icarus_november_2025.csv";

const board: Leaderboard = {
  benchmark: "verilogeval-2",
  url: "https://huggingface.co/spaces/HPAI-BSC/TuRTLe-Leaderboard",
  feed,
  terms: "The leaderboard Space carries the Apache 2.0 license. robots.txt allows the feed path.",
  host: "TuRTLe",
  stats: {
    'Syntax (STX)': { name: 'Syntax', unit: '%', better: 'higher' },
    'Functionality (FNC)': { name: 'Functionality', unit: '%', better: 'higher' },
    'Synthesis (SYN)': { name: 'Synthesis', unit: '%', better: 'higher' },
    Power: { name: 'Power score', unit: '%', better: 'higher' },
    Performance: { name: 'Performance score', unit: '%', better: 'higher' },
    Area: { name: 'Area score', unit: '%', better: 'higher' },
  },
  async fetch() {
    return turtleColumns(feed, 'VerilogEval S2R', 'Functionality (FNC)', 45);
  },
};
export default board;
