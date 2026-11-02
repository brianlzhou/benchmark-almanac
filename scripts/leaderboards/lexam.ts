// LEXam. lexam-benchmark.github.io shows two static leaderboard tables: "Judge Scores on Open Questions"
// (an LLM judge grades open answers against reference answers, 0 to 100) and "Accuracy on Multiple-Choice
// Questions". The page leads with the open-question table, so its judge score is the score here; the
// multiple-choice accuracy is a separate number the page ranks on its own. Medal emoji are stripped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://lexam-benchmark.github.io/';

const board: Leaderboard = {
  benchmark: 'lexam',
  url: PAGE,
  feed: `${PAGE} (static HTML table, Judge Scores on Open Questions)`,
  terms: 'Static project page on GitHub Pages (no robots.txt); the page states no terms.',
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => /judge scores on open questions/i.test(c.text)));
    if (!t) throw new Error('open-question table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[1]?.text.replace(/[\u{1F947}-\u{1F949}]/gu, '').trim();
      const score = num(r[2]?.text);
      if (model && score !== undefined) rows.push({ model, score });
    }
    return rows;
  },
};
export default board;
