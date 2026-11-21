// SuperLim reports pseudoalpha on the Swedish analogy test set.
// The National Library of Sweden’s results bundle includes four complete 18,593-question runs.
import type { Leaderboard } from './types.ts';
import { superlimRows } from './dalaj-ged-2.ts';

const feed = "https://lab.kb.se/leaderboard/_nuxt/results.67b82063.js";

const board: Leaderboard = {
  benchmark: "swedish-analogy",
  url: "https://lab.kb.se/leaderboard/results",
  feed,
  terms: "The leaderboard gives no separate license for scores. The host has no robots.txt.",
  stats: {
    N: { name: 'Items', unit: 'count' },
    accuracy: { name: 'Accuracy', unit: 'score', better: 'higher' },
    pseudoalpha: { name: 'Pseudo-alpha', unit: 'score', better: 'higher', note: 'Agreement coefficient for the analogy test.' },
  },
  async fetch() {
    return superlimRows('sweanalogy', 4);
  },
};
export default board;
