// Agent Island estimates model skill from multiplayer elimination games.
// The official rankings use the 25th percentile of skill, normalized by the top model's median skill.
// Only models that played at least ten games qualify. The intervals describe uncertainty in skill.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://storage.googleapis.com/agent-island/rankings/latest.json';
type Run = { model: string, rank_q25: number, posterior_mean: number, q025: number, q25: number,
  q50: number, q75: number, q975: number, games_played: number, wins: number };
export default {
  benchmark: 'agent-island', url: 'https://www.agentisland.ai/', feed,
  aliases: { "nvidia/nemotron-3-ultra-550b-a55b": "nemotron-3-ultra", "cohere/command-a": "cohere-command-a", "cohere/command-r-plus-08-2024": "command-r-plus" },
  terms: 'The authors publish the ranking and game logs in their public bucket at https://storage.googleapis.com/agent-island/',
  async fetch() {
    const data = await fetchJson<{ timestamp: string, rankings: Run[] }>(feed);
    const runs = data.rankings.filter(r => r.games_played >= 10);
    const top = runs.reduce((a,b) => a.q25 > b.q25 ? a : b);
    if (!(top.q50 > 0)) throw new Error('Invalid top model median');
    return checked(runs.map(r => {
      const norm = (v: number) => {
        if (!Number.isFinite(v)) throw new Error('Missing skill statistic');
        return v / top.q50;
      };
      return { model: r.model, score: norm(r.q25), low: norm(r.q025), high: norm(r.q975),
        trials: r.games_played, date: data.timestamp.slice(0,10),
        metrics: { median: norm(r.q50), upperQuartile: norm(r.q75), mean: norm(r.posterior_mean), wins: r.wins } };
    }),59);
  },
} satisfies Leaderboard;
