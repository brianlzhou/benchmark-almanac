// CompanyBench ranks agents by all-core pass rate in simulated bank workflows. Its leaderboard HTML supplies the overall score, tool calls and category heatmap.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://bench.turing.com/companybench/leaderboard/";

const board: Leaderboard = {
  benchmark: "companybench-turing",
  url: "https://bench.turing.com/companybench/leaderboard/",
  feed: FEED,
  terms: "The publisher gives no reuse license on the benchmark page. https://bench.turing.com/companybench/leaderboard/ The robots.txt URL serves site HTML.",
  async fetch() {
    const html = await fetchText(FEED);
    const parts: Record<string, string> = {};
    const categories = new Map<string, Record<string, number>>();
    for (const [, label, model, value] of html.matchAll(/class="cell"[^>]+data-tip="([^"]+?) — ([^"]+?): ([\d.]+)%"/g)) {
      const name = text(label);
      const metrics = categories.get(model) ?? {};
      metrics[name] = Number(value);
      categories.set(model, metrics);
      parts[name] = name;
    }
    const rows = [...html.matchAll(/<li data-model="([^"]+)" data-board-rank="\d+" data-sort-score="([\d.]+)" data-sort-tool_calls="([\d.]+)"/g)].map(([, model, rate, calls]) => {
      const metrics = categories.get(model);
      if (!metrics || Object.keys(metrics).length < 9) throw new Error(`Missing category scores for ${model}`);
      return { model: text(model), score: Number(rate) * 100, trials: 10, metrics: { ...metrics, toolCalls: Number(calls) } };
    });
    if (rows.length < 4) throw new Error('Missing CompanyBench leaderboard rows');
    board.parts = parts;
    return rows;
  },
};
export default board;
