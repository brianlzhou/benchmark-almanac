// Overall composite over six datasets and three rounds.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/superinsight/superinsight-ai-benchmark/HEAD/benchmark_presentation_v2.md";
const board: Leaderboard = {
  benchmark: "medical-chronology-llm-benchmark",
  parts: {
    f1: { name: 'F1', group: 'Dimension' },
    formatting: { name: 'Formatting', group: 'Dimension' },
    chronology: { name: 'Chronology', group: 'Dimension' },
    rougeL: { name: 'ROUGE-L', group: 'Dimension' },
    hallucination: { name: 'Hallucination', group: 'Dimension', note: 'Higher scores mean fewer unsupported claims.' },
  },
  url: "https://github.com/superinsight/superinsight-ai-benchmark",
  feed: FEED,
  terms: "Apache-2.0 repository; raw.githubusercontent.com has no robots.txt.",
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0]?.includes("Composite"));
    if (!table) throw new Error('Published overall results table is missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[7]);
      if (score === undefined || !cells[0]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[1,"f1"],[2,"formatting"],[3,"chronology"],[4,"rougeL"],[5,"semantic"],[6,"hallucination"]] as const) {
        const value = num(cells[column]);
        if (value !== undefined) metrics[key] = value;
      }
      out.push({ model: cells[0].replace(/[†‡]/g, ""), setting: cells[0].includes("†") ? "Nebius FP16" : cells[0].includes("‡") ? "Nebius FP4" : undefined, score, metrics });
    }
    if (out.length < 3) throw new Error(`Only ${out.length} model rows`);
    return out;
  },
};
export default board;
