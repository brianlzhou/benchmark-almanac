// Published T-LAG overall score. Coverage and perfect outputs remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const FEED = "https://huggingface.co/datasets/pulse-ai/PulseBench-Tab/raw/main/README.md";
const board: Leaderboard = {
  benchmark: "pulsebench-tab",
  url: "https://huggingface.co/datasets/pulse-ai/PulseBench-Tab",
  feed: FEED,
  terms: "CC BY-NC-ND 4.0 dataset; factual published result values are attributed without changing their units; Hugging Face robots.txt permits the raw card.",
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0]?.includes("T-LAG Score"));
    if (!table) throw new Error('Published overall results table is missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[2]);
      if (score === undefined || !cells[1]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[3, "coverage"], [4, "perfect"]] as const) {
        const value = num(cells[column]);
        if (value !== undefined) metrics[key] = value;
      }
      out.push({ model: cells[1], score, metrics, setting: `run month ${cells[5]}` });
    }
    if (out.length < 3) throw new Error(`Only ${out.length} model rows`);
    return out;
  },
};
export default board;
