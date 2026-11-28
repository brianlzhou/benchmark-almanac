// CheatBench on cheatbench.ai. The page is server-rendered with one leaderboard table: Model | ten task
// columns | Average. Average (0 to 100) is the score. The reader lives in visulogic.ts.
import type { Leaderboard } from './types.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://www.cheatbench.ai/';

const board: Leaderboard = {
  benchmark: 'cheatbench',
  parts: {
    mr: { name: 'Mathematical Research', group: 'Category' },
    mm: { name: 'Multimodal', group: 'Category' },
    cw: { name: 'Creative Writing', group: 'Category' },
    svg: { name: 'SVG Competition', group: 'Category' },
    mc: { name: 'Menial Computation', group: 'Category' },
    bio: { name: 'Biology and Bioinformatics', group: 'Category' },
    kw: { name: 'Knowledge Work', group: 'Category' },
    bg: { name: 'Board Games', group: 'Category' },
    sy: { name: 'Sycophancy', group: 'Category' },
    swe: { name: 'Software Engineering', group: 'Category' },
  },
  url: URL,
  feed: `${URL} (leaderboard table, Average)`,
  terms: 'Server-rendered public page; the site has no robots.txt and no terms.',
  aliases: {},
  fetch: () => tableRows(URL, {
    model: /^Model$/i,
    score: /^Average$/i,
    metrics: {
      mr: /^MR$/i,
      mm: /^MM$/i,
      cw: /^CW$/i,
      svg: /^SVG$/i,
      mc: /^MC$/i,
      bio: /^BIO$/i,
      kw: /^KW$/i,
      bg: /^BG$/i,
      sy: /^SY$/i,
      swe: /^SWE$/i,
    },
  }),
};
export default board;
