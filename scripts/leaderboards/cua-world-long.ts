// CUA-World-Long (Gym-Anything). The project page cmu-l3.github.io/gym-anything/ has one static table,
// "Leaderboard: CUA-World-Long": rank, model, method (step budget or test-time auditing), Avg Score (checklist
// points) and Pass Rate. The board ranks by Pass Rate, the record's headline, so that is the score; the
// method goes in as the harness, since one model appears with several budgets. Detail rows under each entry
// (one cell) are skipped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://cmu-l3.github.io/gym-anything/';

const board: Leaderboard = {
  benchmark: 'cua-world-long',
  url: PAGE,
  feed: `${PAGE} (static HTML table, Pass Rate)`,
  terms: 'Static project page on GitHub Pages (no robots.txt); the page states no terms.',
  aliases: {
    'Kimi-K 2.5': 'kimi-k2-5',
  },
  async fetch() {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => /pass rate/i.test(c.text)));
    const head = t?.[0]?.map((c) => c.text.toLowerCase()) ?? [];
    const iModel = head.indexOf('model');
    const iMethod = head.indexOf('method');
    const iPass = head.indexOf('pass rate');
    if (!t || iModel < 0 || iPass < 0) throw new Error(`unexpected CUA-World-Long header: ${head.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      if (r.length < head.length) continue;
      const model = r[iModel].text.replace(/[▼▲]/g, '').trim();
      const score = num(r[iPass].text);
      if (model && score !== undefined) rows.push({ model, score, harness: iMethod >= 0 ? r[iMethod].text || undefined : undefined });
    }
    return rows;
  },
};
export default board;
