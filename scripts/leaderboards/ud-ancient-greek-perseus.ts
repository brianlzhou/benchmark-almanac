// UD Ancient Greek Perseus ranks dependency parsers by labeled attachment F1.
// The official CoNLL 2018 page lists systems and submission identifiers by treebank.
import type { Leaderboard } from './types.ts';
import { conllLas } from './ud-ancient-greek-proiel.ts';

const feed = "https://universaldependencies.org/conll18/results-las.html";

const board: Leaderboard = {
  benchmark: "ud-ancient-greek-perseus",
  url: "https://universaldependencies.org/conll18/results-las.html#grc_perseus",
  feed,
  terms: "The organizers publish the scores in HTML and give no separate license for that table. The host has no robots.txt.",
  async fetch() {
    return conllLas(feed, 'grc_perseus');
  },
};
export default board;
