// L-Eval (long-context evaluation, OpenLMLab). l-eval.github.io draws one table per evaluator from CSV
// files beside the page. The default tab, Exact Match, reads exam_LEval_leaderboard.csv: the closed-ended
// tasks (Coursera, GSM100, QuALITY, TOEFL) and their Avg, which is the score here. The other tabs (GPT-4,
// GPT-3.5 judge, F1, ROUGE) grade the open-ended tasks and are not read. Rows marked "(Ret.)" run
// gpt-3.5-turbo-0613 on retrieved chunks; the retriever (bm25 or ada) becomes the harness. The table dates
// from the 2023 paper and names models in the authors' shorthand, so most names need aliases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const PAGE = 'https://l-eval.github.io/';
const FEED = `${PAGE}exam_LEval_leaderboard.csv`;

const board: Leaderboard = {
  benchmark: 'l-eval',
  url: PAGE,
  feed: `${FEED} (Exact Match tab, Avg)`,
  terms: 'CSV file on the L-Eval GitHub Pages site that the page loads (no robots.txt); the L-Eval repository is GPL-3.0.',
  aliases: {
    'claude1.3-100k': 'claude-1-3',
    'turbo-16k-0613': 'gpt-3-5-turbo-jun-2023',
    'turbo-0613': 'gpt-3-5-turbo-jun-2023',
    'llama2-13b-chat': 'llama-2-13b',
    'llama2-7b-chat': 'llama-2-7b',
    'chatglm2-6b-8k': 'chatglm2-6b',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = num(r.Avg);
      if (!r.Model || score === undefined) continue;
      const ret = r.Model.match(/^(\w+)-(.+?)\s*\(Ret\.\)$/);
      rows.push(ret ? { model: ret[2], score, harness: `${ret[1]} retrieval` } : { model: r.Model.trim(), score });
    }
    if (!rows.length) throw new Error('no L-Eval rows');
    return rows;
  },
};
export default board;
