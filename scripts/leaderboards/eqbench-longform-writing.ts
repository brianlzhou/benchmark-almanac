// Longform Creative Writing on eqbench.com. creative_writing_longform.js holds the board as a CSV string.
// Its overall_score_100, the judge's 0 to 100 score over the eight chapters, is the score. The board's Length
// (avg_chapter_length, characters per chapter), Vocab (vocab_complexity), Slop (slop_score) and Repetition
// (repetition_score) columns are kept as metrics length, vocab, slop and repetition. Read through eqbenchRows
// in creative-writing-v3.ts.
import type { Leaderboard } from './types.ts';
import { EQBENCH_ALIASES, EQBENCH_TERMS, eqbenchFeed, eqbenchRows } from './creative-writing-v3.ts';

const board: Leaderboard = {
  benchmark: 'eqbench-longform-writing',
  url: 'https://eqbench.com/creative_writing_longform.html',
  feed: `${eqbenchFeed('creative_writing_longform.js', 'leaderboardDataLongformV3')} overall_score_100`,
  terms: EQBENCH_TERMS,
  aliases: EQBENCH_ALIASES,
  fetch: () =>
    eqbenchRows('creative_writing_longform.js', 'leaderboardDataLongformV3', 'overall_score_100', 1, {
      length: 'avg_chapter_length',
      vocab: 'vocab_complexity',
      slop: 'slop_score',
      repetition: 'repetition_score',
    }),
};
export default board;
