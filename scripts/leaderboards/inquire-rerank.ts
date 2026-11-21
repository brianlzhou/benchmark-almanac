// INQUIRE-Rerank measures average precision at 50 on ecological image queries. Its leaderboard table reports overall accuracy and four query categories.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://inquire-benchmark.github.io/";

const board: Leaderboard = {
  benchmark: "inquire-rerank",
  url: "https://inquire-benchmark.github.io/",
  feed,
  terms: "The evaluation repository uses MIT. The website gives no separate reuse terms for the score tables. https://github.com/inquire-benchmark/INQUIRE/blob/main/LICENSE The site returns a 404 page for robots.txt.",
  async fetch() {
    const article = await fetchText(feed);
    const table = tables(article).find(t => t[0]?.[2]?.text === 'Overall' && t[1]?.[0]?.text === 'GPT-4o');
    if (!table || table[0].map(c => c.text).join('|') !== 'Method|Size|Overall|Appearance|Behavior|Context|Species') throw new Error('Missing INQUIRE-Rerank table');
    const cols = table[0].slice(3).map(c => c.text);
    board.parts = Object.fromEntries(cols.map(c => [c, c]));
    const rows = table.slice(1).filter(r => !/random/i.test(r[0].text)).map(r => {
      const [score, ...values] = r.slice(2).map(c => num(c.text));
      if (score == null || values.length !== 4 || values.some(v => v == null)) throw new Error('Incomplete INQUIRE-Rerank result');
      const size = r[1].text.match(/^([\d.]+)([BM])$/);
      return { model: r[0].text, params: size ? Number(size[1]) * (size[2] === 'M' ? 0.001 : 1) : undefined,
        score, metrics: Object.fromEntries(cols.map((c, i) => [c, values[i]!])) };
    });
    if (rows.length < 23) throw new Error('Missing INQUIRE-Rerank models');
    return rows;
  },
};

export default board;
