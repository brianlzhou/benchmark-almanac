// DualEntry scores a model when it passes an accounting case on at least two of three runs.
// The page lists accuracy for all models and publishes cost, consistency and task breakdowns in its charts.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const feed = "https://www.dualentry.com/benchmark";
type Point = { model: string; costTask?: number; costRun?: number; duration?: number; consistency?: number; passed?: number[] };
type Part = { name?: string; key?: string; tasks: number };

const board: Leaderboard = {
  benchmark: "dualentry-accounting-ai-benchmark",
  url: "https://www.dualentry.com/benchmark",
  feed,
  terms: "DualEntry prohibits scraping and requires prior written permission for redistribution. Keep this link for reference. robots.txt allows the feed path.",
  parts: {
    'Transaction Classification': { name: 'Transaction Classification', group: 'Accounting area' },
    'Journal Entries': { name: 'Journal Entries', group: 'Accounting area' },
    'Accounts Payable': { name: 'Accounts Payable', group: 'Accounting area' },
    'Accounts Receivable': { name: 'Accounts Receivable', group: 'Accounting area' },
    'Bank Reconciliation': { name: 'Bank Reconciliation', group: 'Accounting area' },
    'Financial Reporting': { name: 'Financial Reporting', group: 'Accounting area' },
    'Month-End Close': { name: 'Month-End Close', group: 'Accounting area' },
    Easy: { name: 'Easy', group: 'Difficulty' },
    Medium: { name: 'Medium', group: 'Difficulty' },
    Hard: { name: 'Hard', group: 'Difficulty' },
  },
  stats: { consistency: { name: 'Consistency', unit: '%', better: 'higher' }, costPerRun: { name: 'Cost per run', unit: 'usd', better: 'lower' }, latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  chart: {
    title: 'Accuracy vs. cost',
    x: { key: 'cost', label: 'Cost per task', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Accuracy', unit: '%', better: 'higher' },
    note: 'DualEntry plots accounting accuracy against cost per task on a log scale.',
  },
  async fetch() {
    const page = await fetchText(feed);
    const detail = new Map<string, { cost: number; metrics: Record<string, number> }>();
    const seenParts = new Set<string>();
    for (const script of page.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
      const source = script[1], marker = /const DATA\s*=\s*(?=\[)/.exec(source);
      if (!marker) continue;
      const data = jsLiteral<Point[]>(source, marker.index + marker[0].length);
      const group = /const (AREAS|LEVELS)\s*=\s*(?=\[)/.exec(source);
      if (group) {
        const parts = jsLiteral<Part[]>(source, group.index + group[0].length);
        parts.forEach((part, i) => {
          const name = part.name ?? part.key!;
          seenParts.add(name);
          for (const p of data) {
            const entry = detail.get(p.model);
            if (entry && Number.isFinite(p.passed?.[i])) entry.metrics[name] = p.passed![i] * 100 / part.tasks;
          }
        });
      } else for (const p of data) {
        if (Number.isFinite(p.costTask)) detail.set(p.model, { cost: p.costTask!, metrics: {
          consistency: p.consistency!, costPerRun: p.costRun!, latency: p.duration! } });
      }
    }
    const rows = page.split('<div bm-row=""').slice(1).map(block => {
      const model = block.match(/bm-name=""[^>]*>([^<]+)</)?.[1];
      const accuracy = block.match(/bm-accuracy=""[^>]*>([\d.]+)</)?.[1];
      const license = block.match(/fs-list-field="license"[^>]*>([^<]+)</)?.[1];
      if (!model || !accuracy) throw new Error('Invalid DualEntry leaderboard row');
      return { model, score: Number(accuracy), trials: 3, open: license?.toLowerCase().startsWith('open'), ...detail.get(model) };
    });
    if (rows.length < 29 || detail.size < 27 || seenParts.size < 10) throw new Error('Incomplete DualEntry leaderboard');
    return rows;
  },
};
export default board;
