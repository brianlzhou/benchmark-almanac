// MedXpertQA: the main multimodal comparison publishes a final Avg across Text and MM.
//  The final Avg is the whole-benchmark accuracy. Text-only models lack a combined score and are excluded.
//  Text, MM, reasoning and understanding averages remain metrics.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2501.18362";
import { paperRows } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "medxpertqa",
  url: "https://github.com/TsinghuaC3I/MedXpertQA",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, {"table": 4, "header": "MedXpertQA Text", "score": 9, "width": 10, "min": 9, "skip": "^Expert", "metrics": {"text": 3, "multimodal": 6, "reasoning": 7, "understanding": 8}});
  },
};
export default board;
