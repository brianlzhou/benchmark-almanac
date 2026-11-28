// Fab AI measures whether models identify words a Kiswahili learner cannot yet decode.
// The leaderboard page includes model metadata and adjusted balanced accuracy in its chart data.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const feed = "https://www.fab-ai.org/benchmarks?benchmark=DA-sw&benchmarkType=foundational-literacy&cost=10&dataset=&modelMode=default&models=%5B%5D&pageView=table";
type Result = { benchmark_domain: string; modelId: string; accuracy: number; n: number; bad_format: number };
export async function fabAccuracy(url: string, domain: string, minimum: number) {
  const source = await fetchText(url);
  const marker = 'originalData:[';
  const start = source.indexOf(marker);
  if (start < 0) throw new Error('Missing Fab AI chart data');
  // Svelte serializes fractions without a leading zero. Normalize numeric literals outside strings.
  const literal = source.slice(start + marker.length - 1).replace(/("(?:[^"\\]|\\.)*")|([:,])(-?)\.(\d+)/g,
    (whole, quoted, prefix, sign, digits) => quoted ? whole : prefix + sign + '0.' + digits);
  const results = jsLiteral<Result[]>(literal, 0).filter(r => r.benchmark_domain === domain);
  const models = new Map([...source.matchAll(/"(\d+)":\{id:"\1",name:"[^"]+",displayName:("(?:[^"\\]|\\.)*")/g)]
    .map(m => [m[1], JSON.parse(m[2]) as string]));
  if (results.length < minimum) throw new Error('Incomplete Fab AI rows for ' + domain);
  return results.map(r => {
    const model = models.get(r.modelId);
    if (!model || !Number.isFinite(r.accuracy)) throw new Error('Invalid Fab AI score');
    return { model, score: r.accuracy, metrics: { items: r.n, badFormat: r.bad_format } };
  });
}

const board: Leaderboard = {
  benchmark: "fab-decodability-assessment",
  url: "https://www.fab-ai.org/benchmarks?benchmark=DA-sw&benchmarkType=foundational-literacy&cost=10&dataset=&modelMode=default&models=%5B%5D&pageView=table",
  feed,
  terms: "Fab AI marks the leaderboard as all rights reserved. robots.txt allows the feed path.",
  stats: { items: { name: 'Items', unit: 'count' } },
  async fetch() {
    return (await fabAccuracy(feed, 'DA-sw', 32)).map(({ metrics: { badFormat: _, ...metrics }, ...row }) => ({ ...row, metrics }));
  },
};
export default board;
