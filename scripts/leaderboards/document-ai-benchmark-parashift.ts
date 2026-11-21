// Parashift compares field extraction on business documents. Its results table gives each model’s published average over the datasets it completed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://parashift.ai/en/document-ai-benchmark/";

const board: Leaderboard = {
  stats: { documentsPerSecond: { name: 'Documents per second', unit: 'count', better: 'higher' } },
  benchmark: "document-ai-benchmark-parashift",
  url: "https://parashift.ai/en/document-ai-benchmark/",
  feed,
  terms: "Parashift reserves all rights in its page footer. https://parashift.ai/en/document-ai-benchmark/ The feed host publishes robots.txt at https://parashift.ai/robots.txt.",
  aliases: {"Gemini 3.8": "gemini-3-8-flash"},
  async fetch() {
    const grids = tables(await fetchText(feed));
    const table = grids.find(t => t[0]?.[0]?.text === 'Benchmark' && t[0][1]?.text === 'Documents');
    const average = table?.find(r => r[0].text === 'Average');
    const speed = grids.find(t => t[0]?.[1]?.text === 'Documents per second');
    if (!table || !average || !speed || table[0].length < 8) throw new Error('Missing benchmark results');
    board.parts = {};
    return table[0].slice(2).map((c, i) => {
      const model = c.text, score = num(average[i + 2]?.text);
      if (!model || score === undefined) throw new Error('Missing model average');
      const metrics: Record<string, number> = {};
      for (const row of table.slice(1)) {
        if (row === average) continue;
        const name = row[0].text;
        board.parts![name] = name;
        const value = num(row[i + 2]?.text);
        if (value !== undefined) metrics[name] = value;
      }
      const rate = speed.find(r => r[0].text === model || r[0].text === model + ' Flash');
      if (rate) metrics.documentsPerSecond = Number(rate[1].text);
      return { model, score, metrics };
    });
  },
};
export default board;
