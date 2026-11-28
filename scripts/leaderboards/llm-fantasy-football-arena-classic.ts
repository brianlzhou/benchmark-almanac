// Arena Classic ranks teams by winning percentage in two fantasy leagues. The public summary for each league identifies the current operators and exact records.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://fantasy-platform-staging.wildcardlabs.tech/v1/public/arena/leagues/classic-trades/summary";
interface Summary { league: { league_name: string }; teams: { public_team_id: string; current_operator_label: string }[]; projection: { standings: { entries: {
  team_id: string; rank: number; wins: number; losses: number; ties: number; points_for_exact: string; points_against_exact: string; winning_percentage_exact: { numerator: number; denominator: number } }[] } } }

const board: Leaderboard = {
  benchmark: "llm-fantasy-football-arena-classic",
  url: "https://arena.wildcardlabs.tech/",
  feed: FEED,
  terms: "The methodology describes the custom harness and gives no explicit license for reusing results. https://arena.wildcardlabs.tech/methodology The robots file permits reference use and bars AI training.", stats:{wins:{name:'Wins',unit:'count',better:'higher'},losses:{name:'Losses',unit:'count',better:'lower'},pointsFor:{name:'Points for',unit:'score',better:'higher'},pointsAgainst:{name:'Points against',unit:'score',better:'lower'}},
  async fetch() {
    const rows = [];
    for (const slug of ['classic-trades','classic-no-trades']) {
      if (rows.length) await new Promise(resolve => setTimeout(resolve, 1000));
      const data = await fetchJson<Summary>(FEED.replace('classic-trades',slug));
      const entries = data.projection.standings.entries;
      if (entries.length < 12) throw new Error('Missing teams in ' + slug);
      for (const r of entries) {
        const team = data.teams.find(t => t.public_team_id === r.team_id);
        const score = r.winning_percentage_exact.numerator / r.winning_percentage_exact.denominator;
        if (!team?.current_operator_label || !Number.isFinite(score)) throw new Error('Invalid team standings');
        rows.push({ model: team.current_operator_label, setting: data.league.league_name, score,
          metrics: { wins: r.wins, losses: r.losses, pointsFor: Number(r.points_for_exact), pointsAgainst: Number(r.points_against_exact) } });
      }
    }
    return rows;
  },
};
export default board;
