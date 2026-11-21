// CortexRetrievalBench ranks financial retrievers by Authority Success@1. The chart supplies percentages and the accompanying report gives bootstrap confidence intervals.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral, text } from '../lib/html.ts';

const FEED = "https://www.micro1.ai/benchmark/cortex-retrieval-bench";

const board: Leaderboard = {
  benchmark: "cortex-retrieval-bench",
  url: "https://www.micro1.ai/benchmark/cortex-retrieval-bench",
  feed: FEED,
  terms: "The public report gives no reuse license for scores. The site lists its sitemap and no path restrictions in robots.txt.",
  async fetch() {
    const page = await fetchText(FEED);
    const chart = /label:\s*"Authority Success@1",\s*rows:\s*(?=\[)/.exec(page);
    if (!chart) throw new Error('Missing Authority Success@1 chart');
    const rows = jsLiteral<{ name: string; score: number }[]>(page, chart.index + chart[0].length);
    const paragraph = text(page).match(/On the final authority set, Success@1 is (.+?)\. Bootstrap 95% intervals are (.+?), respectively/);
    if (!paragraph || rows.length < 4) throw new Error('Incomplete CortexRetrievalBench results');
    const names = [...paragraph[1].matchAll(/([0-9.]+) for (?:the )?([A-Za-z0-9 ]+)/g)];
    const intervals = [...paragraph[2].matchAll(/(0\.\d+)[–-](0\.\d+)/g)];
    if (names.length !== intervals.length || names.length !== rows.length) throw new Error('Incomplete intervals');
    return rows.map(({ name, score }) => {
      const i = names.findIndex((m) => m[2].toLowerCase().replace(/ retriever$/, '') === name.toLowerCase());
      if (i < 0 || Math.abs(Number(names[i][1]) * 100 - score) > 0.01) throw new Error(`Chart and report disagree for ${name}`);
      return { model: name, score, low: Number(intervals[i][1]) * 100, high: Number(intervals[i][2]) * 100 };
    });
  },
};
export default board;
