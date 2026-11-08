// VSI-Bench-Debiased: vision-enabled score on the released 2362-question designer-filtered pilot. Blind results remain metrics.
// The fine-tuned LLaVA model retains its training label. Original-set scores are not mixed with debiased scores.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2511.04655";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "vsi-bench-debiased",
  url: "https://vision-x-nyu.github.io/test-set-training/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, {"table": 8, "header": "Debiased", "score": 5, "width": 9, "min": 7, "metrics": {"blindScore": 6, "visionBlindGap": 7}});
  },
};
export default board;
