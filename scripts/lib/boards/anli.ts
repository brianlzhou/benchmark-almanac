// ANLI A1/A2/A3 are the R1/R2/R3 test rounds. Read test accuracy (%) only, including released
// checkpoints' test columns. Development scores never become test rows or settings.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { num } from '../html.ts';
import { markdownTables } from './github-markdown.ts';

const FEED = 'https://raw.githubusercontent.com/facebookresearch/anli/main/README.md';
export function anliBoard(round: 1 | 2 | 3): Leaderboard {
  return {
    benchmark: `anli-r${round}`, url: 'https://github.com/facebookresearch/anli', feed: FEED,
    terms: 'The authors license ANLI under Creative Commons NonCommercial 4.0; retain attribution and follow the source terms.',
    async fetch() {
      const source = (await fetchText(FEED)).replace(/^(?!\s*\|)([^\n]*\|[^\n]*)$/gm, '|$1|');
      const rows: LeaderboardRow[] = [];
      for (const t of markdownTables(source)) {
        const head = t[0], col = head.findIndex(h => h === `A${round}` || h === `A${round} (test)`);
        if (col < 0) continue;
        for (const r of t.slice(1)) {
          const score = num(r[col]);
          if (r[0] && score !== undefined) rows.push({ model: r[0], score });
        }
      }
      if (!rows.length) throw new Error(`ANLI R${round}: no test accuracy rows`);
      return rows;
    },
  };
}
