// SCADBench ranks OpenSCAD generations by head-to-head Elo. Its leaderboard API supplies the ratings and matchup counts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://scadbench.com/api/leaderboard";

const board: Leaderboard = {
  benchmark: "scadbench",
  url: "https://scadbench.com/#leaderboard",
  feed,
  terms: "The site gives no explicit score reuse license. https://scadbench.com/ The feed host publishes robots.txt at https://scadbench.com/robots.txt.",
  stats: { matchups: { name: 'Matchups', unit: 'count' }, winRate: { name: 'Win rate', unit: '%', better: 'higher' } },
  async fetch() {
    type Entry = { name: string; elo: number; winRate: string; matchups: number; avgCost: number };
    const { leaderboard } = await fetchJson<{ leaderboard: Entry[] }>(feed);
    if (leaderboard.length < 19) throw new Error('Incomplete Elo leaderboard');
    return leaderboard.map(r => {
      if (!r.name || !Number.isFinite(r.elo)) throw new Error('Missing model or Elo');
      return { model: r.name, score: r.elo, cost: r.avgCost, metrics: { matchups: r.matchups, winRate: Number(r.winRate) } };
    });
  },
};
export default board;
