// LLM Confabulations (Lech Mazur). The board is the markdown table under "50-50 Ranking leaderboard" in the
// lechmazur/confabulations README: per model the confabulation rate, the non-response rate and "Weighted",
// their equal-weight mean (percent, lower is better), which ranks the table and is the score. Read through
// the Lech Mazur helpers in nyt-connections-extended.ts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { ghRaw } from './big-bench-extra-hard.ts';
import { LECH_MAZUR_ALIASES, LECH_MAZUR_TERMS, lechMazurName, lechMazurTable } from './nyt-connections-extended.ts';

const REPO = 'confabulations';

const board: Leaderboard = {
  benchmark: 'lech-mazur-confabulations',
  url: `https://github.com/lechmazur/${REPO}`,
  feed: `${ghRaw(`lechmazur/${REPO}`, 'README.md', 'master')} (50-50 Ranking leaderboard, Weighted)`,
  terms: LECH_MAZUR_TERMS(REPO),
  aliases: {
    ...LECH_MAZUR_ALIASES,
    'Gemini 2.5 Pro Preview 05-06': 'gemini-2-5-pro-may-2025',
    'Gemini 2.5 Pro Exp 03-25': 'gemini-2-5-pro-mar-2025',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of await lechMazurTable(REPO, 'master', /^50-50 Ranking leaderboard$/)) {
      const score = Number(r.Weighted);
      if (r.Model && Number.isFinite(score)) rows.push({ ...lechMazurName(r.Model), score });
    }
    return rows;
  },
};
export default board;
