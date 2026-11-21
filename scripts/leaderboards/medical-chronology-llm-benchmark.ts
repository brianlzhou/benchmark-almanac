// Overall composite over six datasets and three rounds, with dataset-level hallucination scores and Golden C diagnostics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/superinsight/superinsight-ai-benchmark/HEAD/benchmark_presentation_v2.md";
const board: Leaderboard = {
  benchmark: "medical-chronology-llm-benchmark",
  stats: { hallucinationA: { name: 'Hallucination score A', unit: '%', better: 'higher' }, hallucinationB: { name: 'Hallucination score B', unit: '%', better: 'higher' }, hallucinationC: { name: 'Hallucination score C', unit: '%', better: 'higher' }, hallucinationD: { name: 'Hallucination score D', unit: '%', better: 'higher' }, hallucinationE: { name: 'Hallucination score E', unit: '%', better: 'higher' }, hallucinationF: { name: 'Hallucination score F', unit: '%', better: 'higher' }, goldenCPrecision: { name: 'Golden C precision', unit: '%', better: 'higher' }, goldenCRecall: { name: 'Golden C recall', unit: '%', better: 'higher' }, goldenCF1: { name: 'Golden C F1', unit: '%', better: 'higher' }, goldenCFalsePositive: { name: 'Golden C false positives', unit: 'count', better: 'lower' }, goldenCMay: { name: 'Golden C may errors', unit: 'count', better: 'lower' } },
  parts: {
    semantic: { name: 'Semantic', group: 'Dimension' },
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
    const tables = markdownTables(await fetchText(FEED));
    const table = tables.find(t => t[0]?.includes("Composite"));
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
      for (const [header, keys] of [
        ['A', ['hallucinationA', 'hallucinationB', 'hallucinationC', 'hallucinationD', 'hallucinationE', 'hallucinationF']],
        ['P', ['goldenCPrecision', 'goldenCRecall', 'goldenCF1', 'goldenCFalsePositive', 'goldenCFalseNegative', 'goldenCMay']],
      ] as const) {
        const breakdown = tables.find(t => t[0]?.[0] === 'Model' && t[0]?.[1] === header);
        const row = breakdown?.slice(1).find(r => r[0] === cells[0]);
        if (!row) continue;
        for (const [i, key] of keys.entries()) {
          const value = num(row[i + 1]);
          if (value !== undefined) metrics[key] = value;
        }
      }
      out.push({ model: cells[0].replace(/[†‡]/g, ""), setting: cells[0].includes("†") ? "Nebius FP16" : cells[0].includes("‡") ? "Nebius FP4" : undefined, score, trials: 3, metrics });
    }
    if (out.length < 3) throw new Error(`Only ${out.length} model rows`);
    return out;
  },
};
export default board;
