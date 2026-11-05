// Elimination Game (Lech Mazur). The board is the markdown table under "Elimination Game Leaderboard" in the
// lechmazur/elimination_game README, ranked by the TrueSkill mean (μ) fitted from the games, which is the
// score in the board's own rating unit. Read through the Lech Mazur helpers in nyt-connections-extended.ts.
// The table's σ (the rating's uncertainty) and Games are kept as metrics.sigma and metrics.games.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { ghRaw } from './big-bench-extra-hard.ts';
import { LECH_MAZUR_ALIASES, LECH_MAZUR_TERMS, lechMazurName, lechMazurTable } from './nyt-connections-extended.ts';

const REPO = 'elimination_game';

const board: Leaderboard = {
  benchmark: 'elimination-game',
  url: `https://github.com/lechmazur/${REPO}`,
  feed: `${ghRaw(`lechmazur/${REPO}`, 'README.md')} (Elimination Game Leaderboard, TrueSkill mu)`,
  terms: LECH_MAZUR_TERMS(REPO),
  aliases: LECH_MAZUR_ALIASES,
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of await lechMazurTable(REPO, 'main', /^Elimination Game Leaderboard$/)) {
      // the header cell is the HTML entity "&mu;"
      const score = Number(r['&mu;'] ?? r['μ']);
      const sigma = Number(r['&sigma;'] ?? r['σ']);
      const games = Number(r.Games);
      const metrics = { ...(Number.isFinite(sigma) && sigma > 0 ? { sigma } : {}), ...(Number.isFinite(games) && games > 0 ? { games } : {}) };
      if (r.Model && Number.isFinite(score)) rows.push({ ...lechMazurName(r.Model), score, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    return rows;
  },
};
export default board;
