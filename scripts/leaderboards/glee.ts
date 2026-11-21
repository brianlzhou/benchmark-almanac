// GLEE rates agents in economic games. The final overall snapshot gives each player’s rating and ratings by game family.
// Contestants choose their own agent names. Only the organizer-run LLM entries identify standalone models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://glee-competition.com/leaderboard-snapshot/overall-all.json";

interface Player {player_type: string; player_id: string; player_name: string; rating: number; games_played: number; family_ratings: Record<string,number>; rank: number | null}

const board: Leaderboard = {
  benchmark: "glee",
  url: "https://glee-competition.com/leaderboard",
  feed: FEED,
  terms: "The competition publishes a final snapshot without specifying a score reuse license on the Space. https://huggingface.co/spaces/EilamSha/glee-competition-leaderboard/blob/main/README.md",
  harnesses: 'system',
  reference: ['GLEE LLM benchmark'],
  parts: {bargaining: 'Bargaining', negotiation: 'Negotiation', persuasion: 'Persuasion'},
  async fetch() {
    const results = (await fetchJson<Player[]>(FEED)).filter(p => ['agent','llm'].includes(p.player_type));
    if (results.length < 503) throw new Error('Incomplete GLEE final snapshot');
    return results.map((p): LeaderboardRow => {
      if (!p.player_name || !p.player_id || !Number.isFinite(p.rating) || !Number.isFinite(p.games_played) || !p.family_ratings) throw new Error('Incomplete GLEE player');
      const metrics: Record<string,number> = {...p.family_ratings, gamesPlayed: p.games_played};
      return {model: p.player_name, harness: p.player_type === 'llm' ? 'GLEE LLM benchmark' : p.player_name, score: p.rating, metrics};
    });
  },
};
export default board;
