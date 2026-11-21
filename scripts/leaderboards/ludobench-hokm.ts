// Ludobench's Hokm standings report win percentage across completed games. The site orders players by wins,
// then win rate and points. Keep its ordinal rank and match counts alongside the percentage.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://ludobench.com/games/hokm/history";

const board: Leaderboard = {
  benchmark: "ludobench-hokm",
  url: "https://ludobench.com/games/hokm/history",
  feed,
  terms: "The terms allow Ludobench to publish anonymized match records. They give no third-party license for standings. robots.txt allows the feed path.",
  async fetch() {
    const header = ["#", "Player", "Played", "Won", "Drawn", "Lost", "Win %", "Points"];
    const table = tables(await fetchText(feed)).map(table => table.map(row => row.map(cell => cell.text))).find(t => header.every((label, i) => t[0]?.[i] === label));
    if (!table || table.length <= 12) throw new Error('Missing leaderboard columns or rows');
    return table.slice(1).map(cells => {
      const [rank, label, played, won, drawn, lost, rate, points] = cells;
      const score = parseFloat(rate);
      if (!label || !Number.isFinite(score) || Number(played) !== Number(won) + Number(drawn) + Number(lost)) throw new Error('Invalid Hokm standing');
      return { model: label.replace(/ AI model$/, ''), score, trials: Number(played),
        metrics: { rank: Number(rank), won: Number(won), drawn: Number(drawn), lost: Number(lost), points: Number(points) } };
    });
  },
};
export default board;
