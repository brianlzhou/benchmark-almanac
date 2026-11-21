// The Guillotine league ranks teams by their final place as they leave the season.
// The public summary identifies the draft model and current operator for each team.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://fantasy-platform-staging.wildcardlabs.tech/v1/public/arena/leagues/guillotine-2026/summary";
interface Summary {
 teams: { public_team_id:string; current_operator_label:string; drafted_by_label:string }[];
 projection: { teams: {team_id:string; state:string; final_place:number|null; elimination_week:number|null; updated_at_ms:number}[];
 elimination_history: {fantasy_week:number; rankings:{team_id:string; weekly_score_exact:string; cumulative_points_through_week_exact:string}[]}[] };
}

const board: Leaderboard = {
  benchmark: "llm-fantasy-football-arena-guillotine",
  url: "https://arena.wildcardlabs.tech/leagues/guillotine-2026/",
  feed,
  terms: "The methodology describes the custom harness and gives no explicit license for reusing results. https://arena.wildcardlabs.tech/methodology The hosts disallow named crawlers and allow the general user agent.",
  async fetch() {
    const d = await fetchJson<Summary>(feed);
    if (d.teams.length !== 18 || d.projection.teams.length !== 18) throw new Error('Incomplete league roster');
    const rows: LeaderboardRow[] = [];
    for (const r of d.projection.teams) {
      if (r.final_place === null && r.state === 'ACTIVE') continue;
      const t = d.teams.find(t => t.public_team_id === r.team_id);
      if (!t?.current_operator_label || !Number.isInteger(r.final_place)) throw new Error('Invalid final place or team');
      const model = t.current_operator_label;
      const models = model === t.drafted_by_label ? undefined : [t.drafted_by_label, model];
      const metrics:Record<string,number> = {};
      if (r.elimination_week) metrics.eliminationWeek = r.elimination_week;
      for (const week of d.projection.elimination_history) {
        const result = week.rankings.find(entry => entry.team_id === r.team_id);
        if (result) {
          metrics['week'+week.fantasy_week] = Number(result.weekly_score_exact);
          metrics.cumulativePoints = Number(result.cumulative_points_through_week_exact);
        }
      }
      rows.push({ model, models, score:r.final_place!, metrics, date:new Date(r.updated_at_ms).toISOString().slice(0,10) });
    }
    if(rows.length < 10) throw new Error('Missing published final places');
    return rows;
  },
};
export default board;
