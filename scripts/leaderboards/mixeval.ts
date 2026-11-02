// MixEval (dynamic benchmark mixture). mixeval.github.io is a static page whose first table is the chat
// model leaderboard: MixEval-Hard, MixEval, Arena Elo and the mixed sub-benchmarks. The MixEval column
// (0 to 100) is the score; rows with "-" there (scored on MixEval-Hard only) are skipped. The second table
// covers base models on a different protocol and is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://mixeval.github.io/';

const board: Leaderboard = {
  benchmark: 'mixeval',
  url: `${URL}#leaderboard`,
  feed: `${URL} (static HTML table, MixEval column)`,
  terms: 'Static GitHub Pages site; the page content is CC BY-SA 4.0.',
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => /^MixEval-Hard/.test(c.text)));
    if (!t) throw new Error('MixEval table not found');
    const head = t[0].map((c) => c.text);
    const iScore = head.findIndex((h) => /^MixEval(\s|$)/.test(h) && !/Hard/.test(h));
    if (iScore < 0) throw new Error(`unexpected MixEval header: ${head.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[0]?.text.replace(/^OpenAI\s+/, '');
      const score = /^\s*-\s*$/.test(r[iScore]?.text ?? '') ? undefined : num(r[iScore]?.text);
      if (model && score !== undefined) rows.push({ model, score });
    }
    return rows;
  },
};
export default board;
