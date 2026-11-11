// PACT (Lech Mazur's bilateral negotiation benchmark). The README of lechmazur/pact leads with the "PACT
// Bilateral Rating" leaderboard, a rating fitted from normalized per-game surplus against the opponents each
// model faced. Its table, "Latest Model-Family Leaderboard Table", lists the latest model of each family and
// is read here, with PACT Bilateral Rating (the board's own unit) as the score. Read through the Lech Mazur
// helpers in nyt-connections-extended.ts. The rating's "Rating 95% CI" is kept as metrics.ciLow and ciHigh,
// and "Average Profit / Round" as metrics.profit.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { ghRaw } from './big-bench-extra-hard.ts';
import { LECH_MAZUR_ALIASES, LECH_MAZUR_TERMS, lechMazurName, lechMazurTable } from './nyt-connections-extended.ts';

const REPO = 'pact';

const board: Leaderboard = {
  benchmark: 'pact-lech-mazur',
  url: `https://github.com/lechmazur/${REPO}`,
  feed: `${ghRaw(`lechmazur/${REPO}`, 'README.md')} (Latest Model-Family Leaderboard Table, PACT Bilateral Rating)`,
  terms: LECH_MAZUR_TERMS(REPO),
  aliases: LECH_MAZUR_ALIASES,
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of await lechMazurTable(REPO, 'main', /Latest Model-Family Leaderboard Table/)) {
      const score = Number(r['PACT Bilateral Rating']);
      const ci = r['Rating 95% CI']?.match(/^\s*(-?[\d.]+)\s*-\s*(-?[\d.]+)\s*$/);
      const profit = Number(r['Average Profit / Round']);
      const metrics = {
        ...(ci ? { ciLow: Number(ci[1]), ciHigh: Number(ci[2]) } : {}),
        ...(r['Average Profit / Round']?.trim() && Number.isFinite(profit) ? { profit } : {}),
      };
      for(const [label,key] of [['CMS Points','cmsPoints'],['Games Played','games'],['Opponents','opponents']]){
        const value=Number(r[label]?.replace(/,/g,''));
        if(r[label]?.trim()&&Number.isFinite(value))(metrics as Record<string,number>)[key]=value;
      }
      if (r.Model && Number.isFinite(score)) rows.push({ ...lechMazurName(r.Model), score, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    return rows;
  },
};
export default board;
