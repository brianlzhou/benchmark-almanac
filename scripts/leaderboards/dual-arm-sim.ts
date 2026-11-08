// Dual-Arm Sim (micro1). A static micro1 report page (see realmpathology.ts, micro1Data): the page's
// leaderboard card is an inline data literal, window.benchmarks_data["dual-arm-sim"], read as data. Its default tab,
// Progress score (0 to 100), is the score.
// Keep only the published all-four-tasks score. Cartridge-swap trial averages and
// costs describe one subset and are not imported as benchmark-wide results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { MICRO1_ALIASES, MICRO1_TERMS, micro1Data } from './realmpathology.ts';

const PAGE = 'https://www.micro1.ai/benchmark/dual-arm-sim';

const board: Leaderboard = {
  benchmark: 'dual-arm-sim',
  url: PAGE,
  feed: `${PAGE} (inline leaderboard data "dual-arm-sim", Progress score)`,
  terms: MICRO1_TERMS,
  aliases: MICRO1_ALIASES,
  async fetch() {
    const rows: LeaderboardRow[] = await micro1Data(PAGE, 'dual-arm-sim');
    for (const row of rows) row.setting = 'All four tasks';
    return rows;
  },
};
export default board;
