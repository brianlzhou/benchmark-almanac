// MLogiQA: the P-MMEval main table publishes accuracy averaged across its ten languages.
//  The MLogiQA column alone is the score. Other suite benchmarks are excluded.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2411.09116";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "mlogiqa",
  url: "https://huggingface.co/datasets/Qwen/P-MMEval",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, {"table": 2, "header": "MLogiQA", "score": 5, "width": 11, "min": 20});
  },
};
export default board;
