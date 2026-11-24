// Speko combines action quality, task capability and call completion in six concierge scenarios.
// The speech-to-speech JSON displays the overall score on a zero-to-one scale.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://speko.com/benchmarks/data.json";
type Entry = { model: string; meta: string; measured: string; cells: Record<string, { v: string }> };

const board: Leaderboard = {
  benchmark: "speko-s2s-six-scenarios",
  url: "https://speko.com/benchmarks/s2s",
  feed,
  terms: "Speko publishes its benchmark JSON under CC BY 4.0. Credit Speko and identify changes. robots.txt allows the feed path.",
  stats: {
    action: { name: 'Action score', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' }, early: { name: 'Early-call rate', unit: '%', better: 'lower' }, reliab: { name: 'Reliability', unit: '%', better: 'higher' }, cap: { name: 'Capability score', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' }, lat: { name: 'Latency', unit: 'ms', better: 'lower' }, answer: { name: 'Answer latency', unit: 'ms', better: 'lower' }, inputPricePerMillion: { name: 'Input price', unit: 'usd-per-mtok', better: 'lower' }, outputPricePerMillion: { name: 'Output price', unit: 'usd-per-mtok', better: 'lower' }, costPerMinute: { name: 'Cost per minute', unit: 'usd', better: 'lower' },
  },
  chart: {
    title: 'Action against First sound',
    note: 'Action score against end of speech to first sound median latency, matching the default Pareto scatter chart on Speko.',
    x: { key: 'lat', label: 'First sound latency', unit: 'ms', better: 'lower' },
    y: { key: 'action', label: 'Action score', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const data = await fetchJson<{ boards: { id: string; meta: string; rows: Entry[] }[] }>(feed);
    const board = data.boards.find(b => b.id === 's2s');
    const n = board?.meta.match(/n=(\d+) per model/);
    if (!board || !n || board.rows.length < 14) throw new Error('Missing six-scenario results');
    return board.rows.map(r => {
      const score = Number(r.cells.score.v || NaN);
      const ci = r.meta.match(/95% CI ([\d.]+)[–-]([\d.]+)/);
      if (!r.model || !Number.isFinite(score) || !ci) throw new Error('Missing Speko overall score or interval');
      const metrics: Record<string, number> = {};
      for (const key of ['action','early','reliab','cap','lat','answer']) {
        const value = parseFloat(r.cells[key]?.v);
        if (Number.isFinite(value)) metrics[key] = value;
      }
      const price = r.cells.price?.v ?? '';
      const minute = price.match(/\$([\d.]+) · min/), tokens = price.match(/\$([\d.]+) \/ \$([\d.]+) · 1M tok/);
      if (minute) metrics.costPerMinute = Number(minute[1]);
      if (tokens) { metrics.inputPricePerMillion = Number(tokens[1]); metrics.outputPricePerMillion = Number(tokens[2]); }
      return { model: r.model, score, low: Number(ci[1]), high: Number(ci[2]), trials: Number(n[1]), date: r.measured, metrics };
    });
  },
};
export default board;
