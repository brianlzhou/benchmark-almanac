// WMArena ranks image-to-video models by blind human preference. The Image + Prompt tab displays the Elo ratings and intervals from the public snapshot.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://wmarena.com/api/leaderboard";

const board: Leaderboard = {
  benchmark: "wmarena-video-arena",
  url: "https://wmarena.com/leaderboard",
  feed,
  stats: { votes: { name: 'Votes', unit: 'count' } },
 terms: "WMArena’s public terms summary permits using anonymous votes for rankings. It gives no explicit score reuse license. https://wmarena.com/leaderboard robots.txt disallows /api/.",
  aliases: {
    "Seedance 1.0 Pro": "seedance-v1-pro",
  },
  async fetch() {
    type Run = {modality:string,display_name:string,elo:number,ci_low:number,ci_high:number,votes:number};
    const {snapshot} = await fetchJson<{snapshot:{rows:Run[]}}>(feed);
    const rows = snapshot.rows.filter(r => r.modality === 'i2v');
    if (rows.length < 10) throw new Error('Missing image-to-video models');
    return rows.map(r => {
      if (!r.display_name || ![r.elo,r.ci_low,r.ci_high,r.votes].every(Number.isFinite)) throw new Error('Invalid arena rating');
      return { model:r.display_name, score:r.elo, low:r.ci_low, high:r.ci_high, metrics:{votes:r.votes} };
    });
  },
};

export default board;
