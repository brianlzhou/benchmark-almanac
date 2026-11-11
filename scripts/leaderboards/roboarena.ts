// RoboArena (distributed real-world A/B evaluation of DROID robot policies). robo-arena.github.io is a
// single-page app whose Policy Leaderboard loads JSON from the team's API, /api/leaderboard: per policy
// the rating (`score`, a Bradley-Terry style rating with no ceiling), its std, the number of A/B evals
// and whether it is open source. The page shows only policies with at least 100 evaluations as official
// (its "all" toggle adds the rest, marked unofficial). Retain all rated rows and flag unofficial ones. The rating is the
// score. Policy ids are run names ("pi05_droid"); the DROID fine-tunes of registry models get aliases. The
// rating's std, which the page shows with it, is kept as `sd`.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://robo-arena.github.io/';
const FEED = 'https://roboarena-api-domain-name.online/api/leaderboard';
// the page's own cut-off for official rows
const OFFICIAL_EVALS = 100;

const board: Leaderboard = {
  benchmark: 'roboarena',
  url: `${PAGE}leaderboard`,
  feed: `${FEED} (all rated policies, official status at ${OFFICIAL_EVALS} A/B evals)`,
  terms: 'Public JSON API that the RoboArena leaderboard page reads (the API host has no robots.txt and states no terms); the RoboArena repository is MIT-licensed.',
  aliases: {
    // DROID fine-tunes released with openpi
    pi05_droid: 'pi0-5',
    pi0_fast_droid: 'pi0-fast',
    pi0_droid: 'pi0',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<{ board: { policy: string; score?: number; std?: number; num_evals?: number }[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const p of data.board) {
      if (!p.policy || typeof p.score !== 'number' || !Number.isFinite(p.score) || (p.num_evals ?? 0) <= 0) continue;
      const official=(p.num_evals ?? 0)>=OFFICIAL_EVALS;
      rows.push({ model: p.policy, score: p.score, setting:official?undefined:'unofficial; fewer than 100 evaluations',
        metrics:{evaluations:p.num_evals!,official:Number(official),...(typeof p.std==='number'?{sd:p.std}:{})} });
    }
    if (!rows.length) throw new Error('no official RoboArena rows');
    return rows;
  },
};
export default board;
