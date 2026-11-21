// CAREBench reports the percentage of unsafe responses. The Handshake page embeds each failure rate and reported interval.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { jsonAfter } from "../lib/html.ts";
const board: Leaderboard = {
  benchmark: "carebench",
  url: "https://joinhandshake.com/research/benchmarks/carebench/",
  feed: "https://joinhandshake.com/research/benchmarks/carebench/",
  terms: "Handshake blocks named crawlers in robots.txt. Its website terms apply. The authors license the dataset under CC BY 4.0.",
  async fetch() {
    const data = jsonAfter<{ defaultMetric: string, models: { label: string, results: { metricKey: string, value: number, lowerBound: number, upperBound: number }[] }[] }>(await fetchText(this.url), '"benchmarkLeaderboard":');
    if (data.defaultMetric !== 'failure' || data.models.length < 5) throw new Error('CAREBench leaderboard changed');
    return data.models.map(({ label, results }) => {
      const result = results.find(r => r.metricKey === 'failure');
      if (!label || !result || ![result.value, result.lowerBound, result.upperBound].every(Number.isFinite)) throw new Error('Incomplete CAREBench row');
      return { model: label, score: result.value, low: result.lowerBound, high: result.upperBound };
    });
  },
};
export default board;
