// SuperLim 2.0 reports the mean of the available test scores. The National Library of Sweden publishes the scores in its results page bundle.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { superlimRows } from './dalaj-ged-2.ts';

const feed = "https://lab.kb.se/leaderboard/_nuxt/results.67b82063.js";

const board: Leaderboard = {
  benchmark: "superlim-2",
  url: "https://lab.kb.se/leaderboard/results",
  feed,
  terms: "The download pages list licenses by dataset. The leaderboard gives no separate score license. https://sprakbanken.se/en/resources/superlim The feed host returns no robots.txt.",
  parts: {"absabank-imm": "ABSAbank-Imm", "argumentation-sentences": "Argumentation sentences", "dalaj-ged-superlim": "Dalaj-ged-superlim", "supersim-superlim-relatedness": "SuperSim Relatedness", "supersim-superlim-similarity": "SuperSim Similarity", "sweanalogy": "Swedish Analogy", "swediagnostics": "SuperLim Diagnostic Dataset", "swedn": "Swe-DN", "swefaq": "Swedish FAQ", "swenli": "SweNLI", "sweparaphrase": "SweParaphrase", "swesat-synonyms": "SweSAT Synonyms", "swewic": "SweWiC", "swewinogender": "SweWinogender", "swewinograd": "SweWinograd"},
  async fetch() {
    return superlimRows(undefined, 18);
  },
};
export default board;
