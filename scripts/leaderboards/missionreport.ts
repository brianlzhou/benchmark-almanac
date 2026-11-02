// MissionReport (micro1). A static micro1 report page (see realmpathology.ts, micro1Data): the page's
// leaderboard card is an inline data literal, window.benchmarks_data["mission-report"], read as data. Its default tab,
// Mean score (0 to 100), is the score.
import type { Leaderboard } from './types.ts';
import { MICRO1_ALIASES, MICRO1_TERMS, micro1Data } from './realmpathology.ts';

const PAGE = 'https://www.micro1.ai/benchmark/mission-report';

const board: Leaderboard = {
  benchmark: 'missionreport',
  url: PAGE,
  feed: `${PAGE} (inline leaderboard data "mission-report", Mean score)`,
  terms: MICRO1_TERMS,
  aliases: MICRO1_ALIASES,
  fetch: () => micro1Data(PAGE, 'mission-report'),
};
export default board;
