// SweFAQ 2.0 reports test accuracy as a percentage. The National Library of Sweden publishes the scores in its results page bundle.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { superlimRows } from './dalaj-ged-2.ts';

const feed = "https://lab.kb.se/leaderboard/_nuxt/results.67b82063.js";

const board: Leaderboard = {
  benchmark: "swefaq-2",
  url: "https://lab.kb.se/leaderboard/results",
  feed,
  stats: { pseudoalpha: { name: 'Pseudo-alpha', unit: 'score', better: 'higher' } },
  terms: "The dashboard embeds the scores in its HTML and gives no separate reuse license. https://markovic.com/swedish_benchmark_V1.1.html The feed host returns no robots.txt.",
  async fetch() {
    return (await superlimRows("swefaq", 13, true)).map(({ metrics: { N: _, accuracy: __, ...metrics } = {}, ...row }) => ({ ...row, metrics }));
  },
};
export default board;
