// Step Race (Lech Mazur's multi-player step game). The board is the markdown table under "LLM Step-Game
// Leaderboard" in the lechmazur/step_game README, ranked by the TrueSkill mean ("mu") fitted from the games,
// which is the score in the board's own rating unit. Read through the Lech Mazur helpers in
// nyt-connections-extended.ts. The table's sigma, the TrueSkill uncertainty of mu, is kept as metrics.sigma.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { ghRaw } from './big-bench-extra-hard.ts';
import { LECH_MAZUR_ALIASES, LECH_MAZUR_TERMS, lechMazurName, lechMazurTable } from './nyt-connections-extended.ts';

const REPO = 'step_game';

const board: Leaderboard = {
  benchmark: 'step-race-lech-mazur',
  url: `https://github.com/lechmazur/${REPO}`,
  feed: `${ghRaw(`lechmazur/${REPO}`, 'README.md')} (LLM Step-Game Leaderboard, mu)`,
  terms: LECH_MAZUR_TERMS(REPO),
  aliases: LECH_MAZUR_ALIASES,
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of await lechMazurTable(REPO, 'main', /^LLM Step-Game Leaderboard$/)) {
      const score = Number(r.mu);
      const sigma = Number(r.sigma);
      const metrics:Record<string,number>={};
      for(const key of ['sigma','exposed','games','p-wins','ratio']){
        if(r[key]?.trim()&&Number.isFinite(Number(r[key])))metrics[key]=Number(r[key]);
      }
      if (r.Model && Number.isFinite(score))
        rows.push({ ...lechMazurName(r.Model), score, metrics });
    }
    return rows;
  },
};
export default board;
