// SweNLI uses the agreement score in the National Library of Sweden’s test standings.
// The results bundle contains per-model test scores and sample counts.
import type { Leaderboard } from './types.ts';
import { superlimRows } from './dalaj-ged-2.ts';

const feed = "https://lab.kb.se/leaderboard/_nuxt/results.67b82063.js";

const board: Leaderboard = {
  benchmark: "swenli",
  url: "https://lab.kb.se/leaderboard/results",
  feed,
  stats: { N: { name: 'Items', unit: 'count' }, alpha: { name: 'Krippendorff alpha', unit: 'score', better: 'higher' }, accuracy: { name: 'Accuracy', unit: 'score', better: 'higher' }, f1: { name: 'F1', unit: 'score', better: 'higher' } },
  terms: "The SuperLim leaderboard lists no separate score reuse terms. The host has no robots.txt.",
  async fetch() {
    return superlimRows('swenli', 13);
  },
};
export default board;
