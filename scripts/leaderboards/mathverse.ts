// MathVerse (CUHK MMLab). mathverse-cuhk.github.io serves its leaderboard as a static HTML table: Model,
// Method, Source, Date, then ALL and six problem versions, each as a pair of columns: the CoT-E score
// (GPT-4 grades the reasoning steps) and "w/o" (plain answer accuracy, 0 to 100). The board ranks by ALL
// accuracy, the number model cards cite, so ALL "w/o" is the score. Rows with only a CoT-E score are left out.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://mathverse-cuhk.github.io/';

const board: Leaderboard = {
  benchmark: 'mathverse',
  url: `${URL}#leaderboard`,
  feed: `${URL} (results table, ALL accuracy)`,
  terms: 'Static GitHub Pages project page with no stated terms; the MathVerse repository is MIT-licensed.',
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'ALL'));
    if (!t) throw new Error('results table not found');
    const head = t[0].map((c) => c.text);
    const sub = t[1].map((c) => c.text);
    if (head[1] !== 'Model' || head[4] !== 'Date' || head[5] !== 'ALL' || sub[0] !== 'CoT-E' || sub[1] !== 'w/o') {
      throw new Error(`unexpected columns: ${head.join(' | ')} / ${sub.join(' | ')}`);
    }
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      const model = r[1]?.text.replace(/[\u{1F947}-\u{1F949}]/gu, '').trim();
      const score = num(r[6]?.text);
      if (!model || score === undefined || /^(human|random)/i.test(model)) continue;
      rows.push({ model, score, date: /^\d{4}-\d\d-\d\d$/.test(r[4].text) ? r[4].text : undefined });
    }
    return rows;
  },
};
export default board;
