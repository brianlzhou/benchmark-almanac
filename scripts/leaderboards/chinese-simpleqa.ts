// Chinese SimpleQA. The project page on livingfuturelab.github.io carries the leaderboard as a static HTML
// table: Models | CO (correct) | NA (not attempted) | IN (incorrect) | CGA (correct given attempted) |
// F-score | six topic columns. The paper ranks by F-score, the harmonic mean of CO and CGA (0 to 100), so
// that is the score. Rows that only name a group ("Closed-Source Large Language Models") are skipped. The
// table is the paper's (arXiv 2411.07140, November 2024), so rows carry that date and the resolver picks the
// snapshot that was current then.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://livingfuturelab.github.io/ChineseSimpleQA/';
const PAPER_DATE = '2024-11-11';

const board: Leaderboard = {
  benchmark: 'chinese-simpleqa',
  url: URL,
  feed: `${URL} (leaderboard table)`,
  terms: 'Static GitHub Pages project page with no robots.txt and no terms; the dataset is CC BY-NC-SA 4.0 and the scores are cited to the authors.',
  aliases: {
    // the gpt-3.5-turbo alias pointed to the 0125 snapshot when the paper ran
    'GPT-3.5': 'gpt-3-5-turbo-jan-2024',
    'InternLM2.5-20B': 'internlm2-5-20b-chat',
    'DeepSeek-67B': 'deepseek-llm-67b',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => /^F-score$/i.test(c.text)));
    if (!t) throw new Error('leaderboard table not found');
    const head = t[0].map((c) => c.text);
    const iModel = head.findIndex((h) => /^models?$/i.test(h));
    const iScore = head.findIndex((h) => /^F-score$/i.test(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const score = num(r[iScore]?.text);
      const model = r[iModel]?.text;
      if (!model || score === undefined || r.length < head.length) continue;
      rows.push({ model, score, date: PAPER_DATE });
    }
    if (!rows.length) throw new Error('no rows in the Chinese SimpleQA table');
    return rows;
  },
};
export default board;
