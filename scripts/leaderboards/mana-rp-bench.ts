// Mana ranks anonymous roleplay responses using player preferences.
// The leaderboard embeds ratings, uncertainty, votes and refusal rates in its initial page data.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter, nextFlight } from '../lib/html.ts';

const feed = "https://mana.land/docs/rp-bench";
const board: Leaderboard = {
  benchmark: "mana-rp-bench",
  url: "https://mana.land/docs/rp-bench",
  feed,
  terms: "Mana requires express authorization to scrape, copy, or distribute service content. The site's robots.txt permits the public page and disallows /api/.",
  stats: {
    winRate: { name: 'Win rate', unit: '%', better: 'higher' },
    refusalRate: { name: 'Refusal rate', unit: '%', better: 'lower' },
    votes: { name: 'Votes', unit: 'count' },
    responses: { name: 'Responses', unit: 'count' },
    refusals: { name: 'Refusals', unit: 'count' },
  },
  async fetch() {
    type Entry = { name: string; score: number; ci: number; win_rate: number; refusal_rate: number; votes: number; provisional: boolean; responses: number; refusals: number };
    const { rows } = jsonAfter<{ rows: Entry[] }>(nextFlight(await fetchText(feed)), '"initialData":');
    if (rows.length < 38) throw new Error('Missing Mana models');
    return rows.map(r => {
      if (!r.name || ![r.score, r.ci, r.win_rate, r.votes, r.responses, r.refusals, r.refusal_rate].every(Number.isFinite)) throw new Error('Incomplete Mana rating');
      return { model: r.name, score: r.score, low: r.score - r.ci, high: r.score + r.ci,
        metrics: { winRate: r.win_rate, refusalRate: r.refusal_rate, votes: r.votes, responses: r.responses, refusals: r.refusals, provisional: Number(r.provisional) } };
    });
  },
};
export default board;
