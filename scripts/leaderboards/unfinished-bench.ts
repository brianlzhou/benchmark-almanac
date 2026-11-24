// Unfinished-Bench (NAVER AI Lab): measures whether coding and workplace agents violate rules when tasked with
// assignments that cannot be completed cleanly under persistence prompts. Headline score is the document-rule
// violation rate (%) under persistence (lower is better). Reads the inline results array var R from the project page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://francis21c.github.io/unfinished-bench/';

const board: Leaderboard = {
  benchmark: 'unfinished-bench',
  url: PAGE,
  feed: PAGE,
  terms: 'Published openly on GitHub Pages by NAVER AI Lab with no robots.txt restrictions.',
  parts: {
    docNoPersistence: { name: 'Document rule, no persistence', group: 'Condition', better: 'lower' },
    userPersistence: { name: 'User rule, persistence', group: 'Condition', better: 'lower' },
    userNoPersistence: { name: 'User rule, no persistence', group: 'Condition', better: 'lower' },
  },
  stats: {
    docDelta: { name: 'Persistence delta (document rule)', unit: '%', better: 'lower', note: 'Increase in document-rule violation rate when persistence is added.' },
    userDelta: { name: 'Persistence delta (user rule)', unit: '%', better: 'lower', note: 'Increase in user-rule violation rate when persistence is added.' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const m = html.match(/var R\s*=\s*(\[[\s\S]*?\]);/);
    if (!m) throw new Error('Unfinished-Bench results array var R not found');
    const entries = JSON.parse(m[1]) as (string | number)[][];
    const out: LeaderboardRow[] = entries.map((r) => {
      const model = String(r[0]).trim();
      const docNoPers = Number(r[1]);
      const docPers = Number(r[2]);
      const docDelta = Number(String(r[3]).replace(/^\+/, ''));
      const userNoPers = Number(r[6]);
      const userPers = Number(r[7]);
      const userDelta = Number(String(r[8]).replace(/^\+/, ''));
      if (![docNoPers, docPers, docDelta, userNoPers, userPers, userDelta].every(Number.isFinite)) {
        throw new Error(`Invalid Unfinished-Bench row for ${model}`);
      }
      return {
        model,
        score: docPers,
        metrics: {
          docNoPersistence: docNoPers,
          userPersistence: userPers,
          userNoPersistence: userNoPers,
          docDelta,
          userDelta,
        },
      };
    });
    if (out.length < 10) throw new Error(`Unfinished-Bench returned only ${out.length} rows`);
    return out;
  },
};
export default board;
