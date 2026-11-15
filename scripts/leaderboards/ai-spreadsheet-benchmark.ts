// Whole 53-task benchmark Pass@1. These are products, with no inferred underlying model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const FEED = "https://huggingface.co/datasets/rowshq/aispreadsheetbenchmark/raw/main/README.md";
const board: Leaderboard = {
  benchmark: "ai-spreadsheet-benchmark",
  url: "https://huggingface.co/datasets/rowshq/aispreadsheetbenchmark",
  feed: FEED,
  terms: "Public Hugging Face dataset card; its robots.txt permits this raw card path.",
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0]?.includes("Pass@1"));
    if (!table) throw new Error('Published overall results table is missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[1]);
      if (score === undefined || !cells[0]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[2, "pass3"], [3, "dynamic"], [4, "seconds"]] as const) {
        const value = num(cells[column]);
        if (value !== undefined) metrics[key] = value;
      }
      out.push({ model: cells[0], score, metrics });
    }
    if (out.length < 3) throw new Error(`Only ${out.length} model rows`);
    return out;
  },
};
export default board;
