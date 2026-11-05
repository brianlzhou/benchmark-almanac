// LLM Confabulations (Lech Mazur). The board is the markdown table under "50-50 Ranking leaderboard" in the
// lechmazur/confabulations README: per model the confabulation rate, the non-response rate and "Weighted",
// their equal-weight mean (percent, lower is better), which ranks the table and is the score. Read through
// the Lech Mazur helpers in nyt-connections-extended.ts. The two rates are kept as metrics.confab and
// metrics.nonResponse (percent).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { ghRaw } from './big-bench-extra-hard.ts';
import { LECH_MAZUR_ALIASES, LECH_MAZUR_TERMS, lechMazurName, lechMazurTable } from './nyt-connections-extended.ts';

const REPO = 'confabulations';

const board: Leaderboard = {
  benchmark: 'lech-mazur-confabulations',
  url: `https://github.com/lechmazur/${REPO}`,
  feed: `${ghRaw(`lechmazur/${REPO}`, 'README.md', 'master')} (50-50 Ranking leaderboard, Weighted)`,
  terms: LECH_MAZUR_TERMS(REPO),
  aliases: LECH_MAZUR_ALIASES,
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of await lechMazurTable(REPO, 'master', /^50-50 Ranking leaderboard$/)) {
      const score = Number(r.Weighted);
      const [confab, nonResponse] = [Number(r['Confab %']), Number(r['Non-Resp %'])];
      const metrics = Number.isFinite(confab) && Number.isFinite(nonResponse) ? { confab, nonResponse } : undefined;
      if (r.Model && Number.isFinite(score)) rows.push({ ...lechMazurName(r.Model), score, metrics });
    }
    return rows;
  },
};
export default board;
