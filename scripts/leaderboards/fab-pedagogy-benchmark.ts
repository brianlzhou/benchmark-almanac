// Fab AI measures accuracy on pedagogical knowledge questions. The page embeds the CDPK overall scores
// and additional rows for each subject and school level.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const feed = "https://www.fab-ai.org/benchmarks?benchmark=CDPK&cost=10&models=%5B%5D&pageView=table";
type Result = { benchmark_domain: string; modelId: string; accuracy: number; n: number; bad_format: number; categories: { name: string; value: string | null }[] };
async function pedagogy(url: string, domain: string, minimum: number) {
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
  const overall = results.filter(r => r.categories.every(c => c.value === null));
  if (overall.length < minimum || new Set(overall.map(r => r.modelId)).size !== overall.length) throw new Error('Incomplete overall standings');
  return overall.map(r => {
    const model = models.get(r.modelId);
    if (!model || !Number.isFinite(r.accuracy)) throw new Error('Invalid Fab AI score');
    const metrics: Record<string, number> = { items: r.n, badFormat: r.bad_format };
    for (const sub of results.filter(s => s.modelId === r.modelId)) {
      const categories = sub.categories.filter(c => c.value !== null);
      if (categories.length !== 1) continue;
      const { name, value } = categories[0];
      const key = name + '_' + value;
      metrics[key] = sub.accuracy;
      (board.parts ??= {})[key] = { name: value!, group: name };
    }
    return { model, score: r.accuracy, metrics };
  });
}


const board: Leaderboard = {
  benchmark: "fab-pedagogy-benchmark",
  url: "https://www.fab-ai.org/benchmarks?benchmark=CDPK&cost=10&models=%5B%5D&pageView=table",
  feed,
  terms: "Fab AI marks the leaderboard as all rights reserved. The code repository has an MIT license. robots.txt allows the feed path.",
  stats: { items: { name: 'Items', unit: 'count' }, badFormat: { name: 'Bad-format answers', unit: 'count', better: 'lower' } },
  async fetch() {
    return pedagogy(feed, 'CDPK', 283);
  },
};
export default board;
