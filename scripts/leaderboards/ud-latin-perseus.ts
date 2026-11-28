// CoNLL 2018 ranks parsers by labeled attachment score. The Latin Perseus section of its results page gives the system scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { CONLL18_STATS, conllLas } from './ud-ancient-greek-proiel.ts';

const feed = "https://universaldependencies.org/conll18/results-las.html";

const board: Leaderboard = {
  benchmark: "ud-latin-perseus",
  stats: CONLL18_STATS,
  url: "https://universaldependencies.org/conll18/results-las.html#la_perseus",
  feed,
  terms: "The organizers publish the scores in HTML and give no separate license for that table. https://universaldependencies.org/conll18/results-las.html The feed host returns no robots.txt.",
  async fetch() {
    return conllLas(feed, 'la_perseus');
  },
};
export default board;
