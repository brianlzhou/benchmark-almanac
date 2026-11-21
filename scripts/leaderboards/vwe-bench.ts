// VWE-Bench: Overall Pass@1 spans all 254 evaluation cases, including verified and unverified query families.
// The paper publishes this aggregate directly. Ten task-type scores and human evaluation remain metrics.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://arxiv.org/html/2608.15265";
import { paperRows } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "vwe-bench", static: 'paper',
  parts: {
    theme: { name: 'Theme', group: 'Task type' },
    themeElements: { name: 'Theme elements', group: 'Task type' },
    blueprint: { name: 'Blueprint', group: 'Task type' },
    distractor: { name: 'Distractor', group: 'Task type' },
    preciseEdit: { name: 'Precise edit', group: 'Task type' },
    fuzzyEdit: { name: 'Fuzzy edit', group: 'Task type' },
    critique: { name: 'Critique', group: 'Task type' },
    guidance: { name: 'Guidance', group: 'Task type' },
    restatement: { name: 'Restatement', group: 'Task type' },
    complex: { name: 'Complex', group: 'Task type' },
  },
  url: "https://usail-hkust.github.io/VibeWorlding-Gym/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, {"table": 6, "header": "Overall", "score": 11, "width": 13, "min": 15, "metrics": {"theme": 1, "themeElements": 2, "blueprint": 3, "distractor": 4, "preciseEdit": 5, "fuzzyEdit": 6, "critique": 7, "guidance": 8, "restatement": 9, "complex": 10, "humanEvaluation": 12}});
  },
};
export default board;
