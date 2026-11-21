// SweParaphrase 2.0 reports test agreement on the SuperLim leaderboard. The National Library of Sweden publishes the scores in its results page bundle.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { superlimRows } from './dalaj-ged-2.ts';

const feed = "https://lab.kb.se/leaderboard/_nuxt/results.67b82063.js";

const board: Leaderboard = {
  benchmark: "sweparaphrase-2",
  url: "https://lab.kb.se/leaderboard/results",
  feed,
  stats: { N: { name: 'Items', unit: 'count' }, alpha: { name: 'Krippendorff alpha', unit: 'score', better: 'higher' }, spearmanr: { name: 'Spearman correlation', unit: 'score', better: 'higher' }, pearsonr: { name: 'Pearson correlation', unit: 'score', better: 'higher' } },
  terms: "The dashboard embeds the scores in its HTML and gives no separate reuse license. https://markovic.com/swedish_benchmark_V1.1.html The feed host returns no robots.txt.",
  async fetch() {
    return superlimRows("sweparaphrase", 13);
  },
};
export default board;
