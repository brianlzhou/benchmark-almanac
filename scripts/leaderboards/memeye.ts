// MemEye: the main results table publishes Avg. LLM-Judge across its evaluation matrix for GPT-5.4-mini.
// The score is converted from a fraction to percent. Avg. exact match remains a metric. Memory methods remain harnesses.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2605.15128";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "memeye",
  url: "https://minghokwok.github.io/MemEye/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t=(await paperTables(FEED))[1], at=t?.findIndex(r=>r[0]?.text==='Avg.');
    if(at===undefined || at<0 || t[at+1][0].text!=='LLM-Judge') throw new Error('MemEye averages changed');
    return t[1].map((c,i)=>({model:'GPT-5.4-mini',harness:c.text,score:Number((num(t[at+1][i+1].text)!*100).toFixed(2)),metrics:{exactMatch:Number((num(t[at][i+3].text)!*100).toFixed(2))}}));
  },
};
export default board;
