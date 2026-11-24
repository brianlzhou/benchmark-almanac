// SnyderBench (Free Systems, Andy Hall and Andy Myers): models propose causal studies of American politics, and graders
// compare each proposal blind with a condensed paper by the political economist Jim Snyder. The results exist only as
// two dot charts in the launch post (2026-11-23), one per question the graders answer:
//   - research design ("Identification"): which design would more convincingly answer its question,
//   - research question ("Contribution"): which would teach us more about an important question in American politics.
// Each dot is one model's share of matchups won, averaged over up to 15 proposals, each judged against three Snyder
// papers by two AI graders (GPT-6 Astra and Claude Fable 5.1). The charts plot 19 OpenAI and Anthropic models but name
// only some, so only named dots are rows: 8 on the design chart, 7 on the question chart. Opus 5.5 is named only on the
// question chart and has no design value, so it has no row. The post names a repo with every proposal and grader output
// (github.com/AndyCWMyers/research-taste), which wasn't public on 2026-11-23. Once it is, read exact values from it.
// Transcribed 2026-11-23 from the dot centers, measured in the image pixels against the charts' gridlines (accurate to
// about half a point). The post's text gives two design values exactly, GPT-4 at 9% and Astra 6.2 at 93%, which the
// measured centers match (8.9 and 93.0), so those two keep the text's values. The whiskers (95% intervals across
// proposals) overlap where models share a release date, so rows carry no interval. A changed image fails the import.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';

const POST = 'https://freesystems.substack.com/p/benchmarking-ais-research-taste-in';
const DESIGN = 'https://substack-post-media.s3.amazonaws.com/public/images/07d1fdf9-0846-46ab-b7f4-f9b5d573809e_1600x1040.png';
const DESIGN_SHA256 = '85eb6cbda44f25a41aa8de823de54de143cedfb1a941c754e74ecf9d6647c7cb';
const QUESTION = 'https://substack-post-media.s3.amazonaws.com/public/images/ab63adc3-e37e-4252-9b9c-5b7ca821ddf4_2048x1332.png';
const QUESTION_SHA256 = '287bf5168db447d1ab722b3df40ed71aef5c1ecc9515cb9262a8f5517da99e3f';

// [chart label, model, research design win rate, research question win rate (when the question chart names the model)]
const DOTS: [string, string, number, number | undefined][] = [
  ['GPT-4', 'GPT-4', 9, 23.3],
  ['Haiku 4.5', 'Claude Haiku 4.5', 11.1, undefined],
  ['Luna 5.6', 'GPT-5.6 Luna', 67.9, undefined],
  ['Astra 6', 'GPT-6 Astra', 84.5, 25.5],
  ['Fable 5.1', 'Claude Fable 5.1', 52.5, 66.7],
  ['Sol 6.1', 'GPT-6.1 Sol', 88.9, 23.3],
  ['Fable 5.2', 'Claude Fable 5.2', 57.0, 61.1],
  ['Astra 6.2', 'GPT-6.2 Astra', 93, 6.9],
];
const ROWS: LeaderboardRow[] = DOTS.map(([, model, design, question]) => ({
  model,
  score: design,
  ...(question === undefined ? {} : { metrics: { question } }),
}));

const board: Leaderboard = {
  benchmark: 'snyderbench',
  url: POST,
  feed: `${DESIGN} and ${QUESTION} (transcribed 2026-11-23)`,
  terms: 'Free Systems publishes the post and its charts publicly on Substack. We read only the two results charts and credit the post.',
  stats: {
    question: {
      name: 'Research question win rate',
      unit: '%',
      better: 'higher',
      note: 'Share of blind matchups where graders preferred the model’s research question to a Snyder paper’s.',
    },
  },
  async fetch() {
    // both charts must be the ones transcribed
    await checkedImageRows(QUESTION, QUESTION_SHA256, []);
    return checkedImageRows(DESIGN, DESIGN_SHA256, ROWS);
  },
};

export default board;
