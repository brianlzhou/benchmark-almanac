// SettlerBench rates models from pairwise victory point results.
// The Season One page embeds all model ratings, game statistics and bootstrap intervals.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const feed = "https://synopticonresearch.com/settlerbench/";
type Entry = { name: string; rating: number; lo: number; hi: number; games: number; cost: number; wins: number;
  win: number; vp: number; trades: number; msgs: number; tokg: number; provisional: boolean };

const board: Leaderboard = {
  benchmark: "settlerbench-season-one",
  url: "https://synopticonresearch.com/settlerbench/",
  feed,
  terms: "The Season One page gives no reuse license. robots.txt allows the feed path.",
  async fetch() {
    const data = jsonAfter<{ divisions: Record<string, { rows: Entry[] }> }>(await fetchText(feed), 'const D=');
    const rows = data.divisions['All models'].rows;
    if (rows.length < 24) throw new Error('Incomplete Season One standings');
    return rows.map(r => {
      if (!r.name || ![r.rating, r.lo, r.hi, r.games].every(Number.isFinite)) throw new Error('Invalid Season One rating');
      const setting = r.name.match(/ \((.*?)\)$/)?.[1];
      return { model: r.name.replace(/ \(.*?\)$/, ''), setting, score: r.rating, trials: r.games, cost: r.cost,
        low: r.lo, high: r.hi, metrics: { wins: r.wins, winRate: 100*r.win, victoryPoints: r.vp, trades: r.trades,
          messages: r.msgs, tokensPerGame: r.tokg, provisional: Number(r.provisional) } };
    });
  },
};
export default board;
