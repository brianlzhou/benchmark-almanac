// Senior Engineer Benchmark measures an agent's ability to redesign and implement a production system.
// Every publishes official rubric totals and effort settings in accessible score labels on the benchmark page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const PAGE = 'https://every.to/benchmarks/senior-engineer-benchmark';
const DIMS: [string, RegExp][] = [
  ['invariantPlan', /^Invariant clarity/i],
  ['simplification', /^Simplification outcome/i],
  ['endToEndWiring', /^End-to-end wiring/i],
  ['noStubs', /^No stubs or parallel authority/i],
  ['correctnessProof', /^Correctness proof/i],
  ['runtimeDurability', /^Runtime durability/i],
];
const normKey = (s: string) => s.replace(/[*‡‖†]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

const board: Leaderboard = {
  benchmark: 'senior-engineer-benchmark-every',
  parts: {
    invariantPlan: { name: 'Invariant clarity and plan quality (out of 20)', group: 'Rubric' },
    simplification: { name: 'Simplification outcome (out of 25)', group: 'Rubric' },
    endToEndWiring: { name: 'End-to-end wiring (out of 10)', group: 'Rubric' },
    noStubs: { name: 'No stubs or parallel authority (out of 17)', group: 'Rubric' },
    correctnessProof: { name: 'Correctness proof and incident preservation (out of 25)', group: 'Rubric' },
    runtimeDurability: { name: 'Runtime durability and lifecycle (out of 3)', group: 'Rubric' },
  },
  url: PAGE,
  feed: PAGE,
  terms: 'Every publishes the benchmark results on its public page. https://every.to/benchmarks/senior-engineer-benchmark',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const dimByCol = new Map<string, Record<string, number[]>>();
    const tbl = tables(html).find((t) => t[0]?.[0]?.text === 'Dimension');
    if (tbl) {
      const headers = tbl[0].slice(1).map((c) => normKey(c.text));
      for (const row of tbl.slice(1)) {
        const dim = DIMS.find(([, re]) => re.test(row[0]?.text ?? ''))?.[0];
        if (!dim) continue;
        for (let i = 0; i < headers.length; i++) {
          const val = row[i + 1]?.text.match(/^([0-9]+(?:\.[0-9]+)?)\s*\//);
          if (!val) continue;
          const bucket = dimByCol.get(headers[i]) ?? {};
          (bucket[dim] ??= []).push(Number(val[1]));
          dimByCol.set(headers[i], bucket);
        }
      }
    }
    const lookup = (model: string, setting: string) => {
      const bucket = dimByCol.get(normKey(`${model}, ${setting}`));
      if (!bucket) return undefined;
      const metrics: Record<string, number> = {};
      for (const [k, arr] of Object.entries(bucket)) {
        metrics[k] = Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
      }
      return Object.keys(metrics).length ? metrics : undefined;
    };
    const rows: LeaderboardRow[] = [];
    const point = /aria-label="([^:"]+), ([^"]+): ([0-9]+(?:\.[0-9]+)?) on a 0 to 100 scale"/g;
    for (const match of html.matchAll(point)) {
      const model = match[1].trim(), setting = match[2].trim();
      rows.push({ model, setting, score: Number(match[3]), metrics: lookup(model, setting) });
    }
    const range = /aria-label="([^:"]+), ([^"]+): score range ([0-9]+) to ([0-9]+) on a 0 to 100 scale"/g;
    for (const match of html.matchAll(range)) {
      const model = match[1].trim(), setting = match[2].trim();
      rows.push({ model, setting, score: (Number(match[3]) + Number(match[4])) / 2, low: Number(match[3]), high: Number(match[4]), metrics: lookup(model, setting) });
    }
    if (rows.length < 7) throw new Error(`Senior Engineer Benchmark score labels missing: ${rows.length}`);
    return rows;
  },
};
export default board;
