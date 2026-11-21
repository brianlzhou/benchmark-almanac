// WebVR ranks webpage recreations by their overall visual rubric score.
// Its official HTML standings list four dimensions and the model’s open or closed status.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://webvr-benchmark.github.io/leaderboard.html";

const board: Leaderboard = {
  benchmark: "webvr",
  url: "https://webvr-benchmark.github.io/leaderboard.html",
  feed,
  terms: "The site embeds scores in HTML. Its repository lists no separate terms for the score table. The host has no robots.txt.",
  parts: { ga: 'Global Aesthetics', nf: 'Navigation and Footer', ssl: 'Section-Specific Layouts', im: 'Interaction and Motion' },
  async fetch() {
    const header = ["Rank", "Model", "Type", "GA", "NF", "SSL", "IM", "Overall"];
    const table = tables(await fetchText(feed)).map(table => table.map(row => row.map(cell => cell.text))).find(t => header.every((label, i) => t[0]?.[i] === label));
    if (!table || table.length <= 19) throw new Error('Missing leaderboard columns or rows');
    return table.slice(1).map(cells => {
      const [,model,type,...scores] = cells;
      const values = scores.map(v => Number(v || NaN));
      if (values.length !== 5 || !values.every(Number.isFinite)) throw new Error('Invalid WebVR scores');
      const [ga,nf,ssl,im,score] = values;
      return { model, score, open: type === 'Open-source', metrics: { ga, nf, ssl, im } };
    });
  },
};
export default board;
