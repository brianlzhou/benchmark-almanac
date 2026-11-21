// Scout Digital's fantasy football standings show season points for AI and human managers.
// The league table reads each manager's total and weekly points from the Scout API.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://www.ai-fpl.com/wp-json/scout/v1/league/1592467";
const board: Leaderboard = {
  benchmark: "ai-fpl",
  url: "https://www.ai-fpl.com/#standings",
  feed,
  terms: "The organizer publishes the standings. I found no reuse license on its rules or gameweek report. The site's robots.txt disallows /wp-json/.",
  stats: {
    weeklyPoints: { name: 'Weekly points', unit: 'score', better: 'higher' },
  },
  async fetch() {
    type Entry = { player_name: string; entry_name: string; total: number; event_total: number; entry: number };
    const { standings } = await fetchJson<{ standings: { has_next: boolean; results: Entry[] } }>(feed);
    if (standings.has_next) throw new Error('The AI FPL standings now span multiple pages');
    const managers = standings.results.filter(r => r.player_name.startsWith('Scout ') && r.player_name !== 'Scout Statto');
    if (managers.length < 7) throw new Error('Missing AI managers');
    return managers.map(r => {
      if (!r.entry_name || !Number.isFinite(r.total) || !Number.isFinite(r.event_total)) throw new Error('Incomplete fantasy team');
      return { model: r.player_name, harness: r.entry_name, score: r.total, metrics: { weeklyPoints: r.event_total },
        link: 'https://fantasy.premierleague.com/entry/' + r.entry + '/history' };
    });
  },
};
export default board;
