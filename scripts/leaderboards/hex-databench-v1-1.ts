// DataBench measures agents on business analytics tasks. Hex supplies each ranked configuration's
// blended percentage, cost, tokens and median latency in the page's table data.
import type { Leaderboard } from './types.ts';
import { jsonAfter, nextFlight } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
const feed = "https://hex.tech/databench/";
const board: Leaderboard = {
  benchmark: 'hex-databench-v1-1',
  url: "https://hex.tech/databench/",
  feed,
  terms: "Hex's robots.txt allows the board. Hex's terms apply. Results are credited to Hex.",
  stats: { latency: { name: 'Median latency', unit: 'ms', better: 'lower' } },
  async fetch() {
    const flight = nextFlight(await fetchText(feed));
    const rows = jsonAfter<{ model: string; score: string; costPerTaskValue: number; tokensPerTaskValue: number; medianLatencyValue: number }[]>(flight, '"rows":');
    if (rows.length < 86) throw new Error('Missing DataBench configurations');
    return rows.map(r => {
      const [model, setting] = r.model.split(' · ');
      const score = Number(r.score.replace(/%$/, ''));
      if (!model || !r.score.endsWith('%') || ![score, r.costPerTaskValue, r.tokensPerTaskValue, r.medianLatencyValue].every(Number.isFinite))
        throw new Error('Invalid DataBench results row');
      return { model, setting, score, cost: r.costPerTaskValue, tokens: r.tokensPerTaskValue, metrics: { latency: r.medianLatencyValue } };
    });
  },
};
export default board;
