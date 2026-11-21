// Artificial Turf War ranks NFL fantasy teams by head-to-head wins, breaking ties on points for. The home page publishes the current season standings.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const FEED = "https://www.artificialturfwar.com/";

const board: Leaderboard = {
  benchmark: "artificial-turf-war",
  url: "https://www.artificialturfwar.com/",
  feed: FEED,
  terms: "The terms identify third-party data and trademarks. They give no explicit license for reusing standings. https://www.artificialturfwar.com/terms The site permits the home page and disallows /api/ in robots.txt.",
  async fetch() {
    const table = tables(await fetchText(FEED)).find((rows) =>
      rows[0]?.slice(0, 5).map((c) => c.text).join('|') === '#|Team|Record|All-play|Points for');
    if (!table || table.length < 9) throw new Error('Missing eight-team standings');
    const record = (s: string) => {
      const m = s.match(/^(\d+)[–-](\d+)(?:[–-](\d+))?$/);
      if (!m) throw new Error(`Unexpected record: ${s}`);
      return [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
    };
    return table.slice(1).map((cells) => {
      const [rank, model, result, allPlay, points] = cells.map((c) => c.text);
      const [wins, losses, ties] = record(result);
      const [allPlayWins, allPlayLosses, allPlayTies] = record(allPlay);
      const pointsFor = num(points);
      const standing = num(rank);
      if (!model || pointsFor == null || standing == null) throw new Error('Incomplete fantasy standings');
      return { model, score: wins, metrics: { standing, losses, ties, pointsFor, allPlayWins, allPlayLosses, allPlayTies } };
    });
  },
};
export default board;
