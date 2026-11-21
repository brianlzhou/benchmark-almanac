// InsureBench's broader comparison scores 150 findings from 50 text packets. Read all saved
// measurements for this workload, including previous versions and promotional routes.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const feed = "https://insurebench.insure-thing.com/decision-models/data.json";
const board: Leaderboard = {
  benchmark: 'insurebench-broader-comparison',
  url: "https://insurebench.insure-thing.com/decision-models",
  feed,
  terms: "InsureThing allows crawling in robots.txt. Its copyright notice gives no separate reuse license for the aggregate results.",
  async fetch() {
    const { rows } = await fetchJson<{ rows: { workload: string; name: string; correct: number; total: number; packets: number;
      seconds: number; cost: number | null; open_weights: boolean; deployment: string; date: string; unknown_charges: number }[] }>(feed);
    const selected = rows.filter(r => r.workload === 'broader150');
    if (selected.length < 33) throw new Error('Missing broader comparison results');
    return selected.map(r => {
      if (!r.name || r.total !== 150 || r.packets !== 50 || !Number.isFinite(r.correct)) throw new Error('Invalid broader comparison result');
      return { model: r.name, score: 100 * r.correct / r.total, setting: r.deployment, open: r.open_weights,
        date: /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : undefined, cost: r.cost === null ? undefined : r.cost / 1000,
        metrics: { latency: r.seconds, correct: r.correct, findings: r.total, packets: r.packets, unknownCharges: r.unknown_charges } };
    });
  },
};
export default board;
