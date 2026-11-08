// LAB-Bench LitQA2: Appendix tables give accuracy, precision and coverage on the complete named category.
//  Accuracy is the share of all questions answered correctly, including abstentions, converted from a fraction to percent.
//  Precision and coverage remain secondary metrics. These are the paper's static results and will not refresh.
//  GPT-4o and GPT-4-Turbo lack snapshot dates in the table and remain unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2407.10362";

const board: Leaderboard = {
  benchmark: "lab-bench-litqa2",
  url: "https://www.futurehouse.org/research-announcements/lab-bench-measuring-capabilities-of-language-models-for-biology-research",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const ts = tables(await fetchText(FEED)).filter(t => t[0]?.some(c => c.text === 'claude-3-5-sonnet-20240620'));
    if (ts.length !== 3) throw new Error('LAB-Bench accuracy, precision and coverage tables missing');
    const selected = ts.map(t => t.find(r => r[0]?.text === 'LitQA2'));
    if (selected.some(r => !r)) throw new Error('LAB-Bench category missing');
    return ts[0][0].slice(2).map((c, i) => {
      const values = selected.map(r => num(r![i + 2]?.text));
      if (values.some(v => v === undefined)) throw new Error('LAB-Bench value missing');
      const model = /^(gpt-4o|gpt-4-turbo)$/.test(c.text) ? `${c.text} (snapshot unspecified)` : c.text;
      return {model, score: values[0]! * 100, metrics: {precision: values[1]! * 100, coverage: values[2]! * 100}};
    });
  },
};
export default board;
