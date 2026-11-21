// Longform Creative Writing on eqbench.com. creative_writing_longform.js holds the board as a CSV string.
// Its overall_score_100, the judge's 0 to 100 score over the eight chapters, is the score. The board's Length
// (avg_chapter_length, characters per chapter), Vocab (vocab_complexity), Slop (slop_score) and Repetition
// (repetition_score) columns are kept as metrics length, vocab, slop and repetition. Read through eqbenchRows
// in creative-writing-v3.ts.
import type { Leaderboard } from './types.ts';
import { EQBENCH_ALIASES, EQBENCH_TERMS, eqbenchFeed, eqbenchRows } from './creative-writing-v3.ts';

const chapters = Array.from({ length: 8 }, (_, i) => 'chapter' + (i + 1));

const board: Leaderboard = {
  benchmark: 'eqbench-longform-writing',
  parts: Object.fromEntries(chapters.map((key, i) => [key, { name: 'Chapter ' + (i + 1), group: 'Chapter', unit: 'score' }])),
  stats: {
    length: { name: 'Average chapter length', unit: 'count' },
    vocab: { name: 'Vocabulary complexity', unit: 'score', better: 'higher' },
    slop: { name: 'Slop score', unit: 'score', better: 'lower' },
    repetition: { name: 'Repetition score', unit: 'score', better: 'lower' },
  },
  url: 'https://eqbench.com/creative_writing_longform.html',
  feed: `${eqbenchFeed('creative_writing_longform.js', 'leaderboardDataLongformV3')} overall_score_100`,
  terms: EQBENCH_TERMS,
  aliases: EQBENCH_ALIASES,
  async fetch() {
    const rows = await eqbenchRows('creative_writing_longform.js', 'leaderboardDataLongformV3', 'overall_score_100', 1, {
      ...Object.fromEntries(chapters.map(key => [key, key + '_avg'])),
      finalJudgement: 'final_judgement_avg',
      length: 'avg_chapter_length',
      vocab: 'vocab_complexity',
      slop: 'slop_score',
      repetition: 'repetition_score',
    });
    for (const row of rows) {
      const scores = chapters.map(key => row.metrics?.[key]);
      if (!scores.every((v): v is number => typeof v === 'number')) continue;
      const initial = scores.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const slope = scores.reduce((total, y, x) => total + (x - 3.5) * y, 0) / 42;
      if (initial > 0) row.metrics!.degradation = Math.max(0, -10 * slope / initial);
    }
    return rows;
  },
};
export default board;
