// LAB-Bench: mean accuracy on the full public and private dataset, in percent.
// The paper defines it as "average accuracy of models on all of LAB-Bench weighted equally by subtask".
// Apply that plain mean to all 31 task/subtask rows in the accuracy appendix, without counting any category twice.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2407.10362";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "lab-bench",
  url: "https://www.futurehouse.org/research-announcements/lab-bench-measuring-capabilities-of-language-models-for-biology-research",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = (await paperTables(FEED))[2];
    if (t?.[0]?.[2]?.text !== 'claude-3-5-sonnet-20240620' || t.length !== 32) throw new Error('LAB accuracy table changed');
    return t[0].slice(2).map((c, i) => {
      const values = t.slice(1).map(r => num(r[i + 2]?.text));
      if (values.some(v => v === undefined)) throw new Error('LAB missing subtask');
      return {model: paperModel(c.text), score: Number((values.reduce((a, b) => a! + b!, 0)! / 31 * 100).toFixed(4))};
    });
  },
};
export default board;
