// The FBN agronomy leaderboard ranks configurations by accuracy on its text questions. The README table also reports subject accuracy, image results, test dates and token pricing.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const feed = "https://raw.githubusercontent.com/gbstox/agronomy_llm_benchmarking/main/README.md";

const board: Leaderboard = {
  benchmark: "llm-agronomy-benchmark-fbn",
  url: "https://github.com/gbstox/agronomy_llm_benchmarking#leaderboard",
  feed,
  terms: "The repository metadata lists no license. https://github.com/gbstox/agronomy_llm_benchmarking The raw file host has no robots.txt.",
  async fetch() {
    const t = markdownTables(await fetchText(feed)).find(t => t[0]?.[1] === 'Overall Score');
    if (!t || t.length < 111 || t[0][4] !== 'Price ($/Mtok)' || !t[0].includes('Community Questions Fbn')) throw new Error('Missing FBN table or columns');
    board.parts = Object.fromEntries(t[0].slice(5).filter(k => !k.startsWith('Image ')).map(k => [k, k]));
    return t.slice(1).map(r => {
      const score = num(r[1]);
      if (!r[0] || score == null || r.length < t[0].length) throw new Error('Incomplete FBN result');
      const metrics: Record<string, number> = {};
      const price = num(r[4]);
      if (price != null) metrics.usdPerMillionTokens = price;
      for (let i = 5; i < t[0].length; i++) {
        const value = num(r[i]);
        if (value != null) metrics[t[0][i]] = value;
      }
      return { model: r[0], score, open: r[2] === 'Open Source', date: r[3], metrics };
    });
  },
};

export default board;
