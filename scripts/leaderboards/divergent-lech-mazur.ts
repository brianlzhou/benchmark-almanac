// Lech Mazur scores the distinctness and validity of words generated from constrained prompts. Two tables list the overall score and repeated-word percentage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const feed = "https://raw.githubusercontent.com/lechmazur/divergent/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "divergent-lech-mazur",
  url: "https://github.com/lechmazur/divergent",
  feed,
  terms: "The publisher displays results at https://github.com/lechmazur/divergent. I could not verify reuse terms. The raw file host has no robots.txt.",
  async fetch() {
    const all = markdownTables(await fetchText(feed));
    const scores = all.find(t => t[0]?.join('|') === 'Model|Score');
    const repeats = all.find(t => t[0]?.join('|') === 'Model Name|% Repeats');
    if (!scores || scores.length < 20 || !repeats) throw new Error('Missing divergent thinking tables');
    return scores.slice(1).map(([model, value]) => {
      const repeated = num(repeats.find(r => r[0] === model)?.[1]), score = num(value);
      if (!model || repeated == null || score == null) throw new Error('Incomplete divergent thinking row for ' + model);
      return { model, score, metrics: { repeatedWords: repeated } };
    });
  },
};

export default board;
