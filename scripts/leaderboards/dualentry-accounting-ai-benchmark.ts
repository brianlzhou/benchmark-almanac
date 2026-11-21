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
  async fetch() {
    const page = await fetchText(feed);
    const detail = new Map<string, { cost: number; metrics: Record<string, number> }>();
    for (const script of page.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
      const source = script[1], marker = /const DATA\s*=\s*(?=\[)/.exec(source);
      if (!marker) continue;
      const data = jsLiteral<Point[]>(source, marker.index + marker[0].length);
      const group = /const (AREAS|LEVELS)\s*=\s*(?=\[)/.exec(source);
      if (group) {
        const parts = jsLiteral<Part[]>(source, group.index + group[0].length);
        parts.forEach((part, i) => {
          const name = part.name ?? part.key!;
          (board.parts ??= {})[name] = { name, group: group[1] === 'AREAS' ? 'Accounting area' : 'Difficulty' };
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
    if (rows.length < 29 || detail.size < 27 || Object.keys(board.parts ?? {}).length < 10) throw new Error('Incomplete DualEntry leaderboard');
    return rows;
  },
};
export default board;
