// Ramp's accounting task selects a bookkeeping category for each expense. The chart defaults
// to normalized Top-1 accuracy in percent. Ramp also gives Top-3 accuracy and relative median latency.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

export const rampPage = 'https://builders.ramp.com/post/financial-benchmarks';
export const rampTerms = "Ramp's robots.txt allows the site. The engineering post gives no data reuse license. Results are credited to Ramp.";
export async function rampBundle(page = rampPage) {
  const html = await fetchText(page);
  const asset = html.match(/<script[^>]+src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
  if (!asset) throw new Error('Ramp chart bundle missing');
  await new Promise(resolve => setTimeout(resolve, 1050));
  return fetchText(new URL(asset, page).href);
}
export function rampArray<T>(bundle: string, firstField: string, minimum: number): T[] {
  // These chart arrays contain flat objects with string and numeric fields.
  for (const match of bundle.matchAll(/\[(?:\{[^{}\[\]]+\},?)+\]/g)) {
    if (!match[0].slice(0, match[0].indexOf('}')).includes(',' + firstField + ':')) continue;
    const quoted = match[0].replace(/([{,])(\w+):/g, '$1"$2":').replace(/:([+-]?)\.(\d+)/g, ':$10.$2');
    const rows = JSON.parse(quoted) as T[];
    if (rows.length < minimum) throw new Error('Missing Ramp chart rows');
    return rows;
  }
  throw new Error('Ramp chart missing: ' + firstField);
}
const board: Leaderboard = {
  benchmark: 'accounting-autocoding-ramp', url: rampPage, feed: rampPage, terms: rampTerms,
  stats: {
    top3: { name: 'Top 3 accuracy', unit: '%', better: 'higher' },
    relativeMedianLatency: { name: 'Relative median latency', unit: 'speedup', better: 'lower' },
  },
  async fetch() {
    const rows = rampArray<{ name: string; top1Norm: number; top3Norm: number; p50Nx: number }>(await rampBundle(), 'top1Norm', 21);
    return rows.map(r => {
      if (!r.name || ![r.top1Norm, r.top3Norm, r.p50Nx].every(Number.isFinite)) throw new Error('Invalid autocoding result');
      return { model: r.name, score: r.top1Norm, metrics: { top3: r.top3Norm, relativeMedianLatency: r.p50Nx } };
    });
  },
};
export default board;
