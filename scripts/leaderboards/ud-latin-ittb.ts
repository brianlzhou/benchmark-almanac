// UD Latin ITTB ranks dependency parsers by labeled attachment F1.
// The official CoNLL 2018 page lists systems and submission identifiers by treebank.
import type { Leaderboard } from './types.ts';
import { CONLL18_STATS, conllLas } from './ud-ancient-greek-proiel.ts';

const feed = "https://universaldependencies.org/conll18/results-las.html";

const board: Leaderboard = {
  benchmark: "ud-latin-ittb",
  stats: CONLL18_STATS,
  url: "https://universaldependencies.org/conll18/results-las.html#la_ittb",
  feed,
  terms: "The organizers publish the scores in HTML and give no separate license for that table. The host has no robots.txt.",
  async fetch() {
    return conllLas(feed, 'la_ittb');
  },
};
export default board;
