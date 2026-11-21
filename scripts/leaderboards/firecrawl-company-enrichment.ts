// Firecrawl's Company Enrichment benchmark compares company-data providers on seven fields.
// The headline score is the common-fields score, the percentage across headquarters, employees, founding year and LinkedIn.
// This importer reads the public results JSON published by the benchmark repository.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/firecrawl/benchmark-company-enrichment/main/benchmark/results/results.json';
interface Metric { score?: number; ci95?: [number, number]; coverage?: number; accuracy_when_answered?: number }
interface System { common?: Metric; all_fields?: Metric; fields?: Record<string, Metric>; coverage?: number; accuracy_when_answered?: number }
interface Data { snapshot?: { date?: string }; systems?: Record<string, System> }
const pct = (x: number | undefined) => x === undefined ? undefined : Math.round(x * 1000) / 10;
const board: Leaderboard = {
  benchmark: 'firecrawl-company-enrichment',
  url: 'https://www.firecrawl.dev/benchmarks/company-enrichment',
  feed: FEED,
  terms: 'The repository publishes its code and data terms. Results are credited to Firecrawl with a link to the repository.',
  parts: {
    hq: { name: 'Headquarters', group: 'Common fields' },
    employees: { name: 'Employees', group: 'Common fields' },
    founded: { name: 'Founded', group: 'Common fields' },
    linkedin: { name: 'LinkedIn', group: 'Common fields' },
    industry: { name: 'Industry', group: 'Extra fields' },
    ticker: { name: 'Ticker', group: 'Extra fields' },
    revenue: { name: 'Revenue', group: 'Extra fields' },
    allFields: { name: 'All fields', group: 'Summary' },
  },
  async fetch() {
    const data = await fetchJson<Data>(FEED);
    const systems = data.systems;
    if (!systems || Object.keys(systems).length < 6) throw new Error('Company Enrichment: fewer than six systems in results');
    const rows: LeaderboardRow[] = [];
    for (const [model, s] of Object.entries(systems)) {
      const score = pct(s.common?.score);
      if (score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (const key of ['hq', 'employees', 'founded', 'linkedin', 'industry', 'ticker', 'revenue']) {
        const v = pct(s.fields?.[key]?.score);
        if (v !== undefined) metrics[key] = v;
      }
      const all = pct(s.all_fields?.score);
      if (all !== undefined) metrics.allFields = all;
      if (s.coverage !== undefined) metrics.coverage = pct(s.coverage)!;
      if (s.accuracy_when_answered !== undefined) metrics.accuracyWhenAnswered = pct(s.accuracy_when_answered)!;
      rows.push({ model, score, date: data.snapshot?.date, low: pct(s.common?.ci95?.[0]), high: pct(s.common?.ci95?.[1]), metrics });
    }
    if (rows.length < 6) throw new Error(`Company Enrichment: ${rows.length} rows, expected at least 6`);
    return rows;
  },
};
export default board;
