// The Aggregate ranks closed-book registry lookups by accuracy. Its benchmark page loads a versioned JavaScript file containing the published rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const feed = "https://theaggregate.ai/our-benchmarks/exotic-recall";


export async function aggregateRows(url: string, id: string, minimum: number): Promise<LeaderboardRow[]> {
  const html = await fetchText(url);
  const entry = html.match(/<script\b[^>]*src="([^"]*\/index-[^"]+\.js)"/)?.[1];
  if (!entry) throw new Error('Missing Aggregate app script');
  const entryUrl = new URL(entry, url);
  await new Promise(resolve => setTimeout(resolve, 1000));
  const index = await fetchText(entryUrl.href);
  const module = index.match(/from\s*"([^"]*\/our-benchmarks-[^"]+\.js)"/)?.[1];
  if (!module) throw new Error('Missing first-party benchmark data module');
  await new Promise(resolve => setTimeout(resolve, 1000));
  const source = await fetchText(new URL(module, entryUrl).href);
  const start = source.indexOf('{id:`' + id + '`,title:');
  if (start < 0) throw new Error('Missing benchmark: ' + id);
  const section = source.slice(start).split(/\},\{id:`[^`]+`,title:/)[0];
  const date = section.match(/run_end:`([\d-]+)`/)?.[1];
  const rowsAt = section.indexOf('rows:[');
  if (rowsAt < 0) throw new Error('Missing standings for ' + id);
  // the minifier writes true as !0 and false as !1, on any field (reference, rt_fixed)
  const literal = section.slice(rowsAt + 5).replace(/([:,[])!([01])(?=[,}\]])/g, (_, p, d) => p + (d === '0' ? 'true' : 'false')).replace(/`([^`\\]*)`/g, (_, v) => JSON.stringify(v))
    .replace(/("(?:[^"\\]|\\.)*")|([:,])(-?)\.(\d+)/g, (m, quoted, prefix, sign, digits) => quoted ? m : prefix + sign + '0.' + digits);
  type Entry = { reference?: boolean; model: string; score: number; n?: number; setting?: string; reasoning_effort?: string };
  const rows = jsLiteral<Entry[]>(literal, 0).filter(r => !r.reference);
  if (rows.length < minimum) throw new Error('Incomplete standings for ' + id);
  return rows.map(r => {
    if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid score for ' + id);
    return { model: r.model, score: r.score, setting: r.setting?.includes("reasoning") ? r.setting.replaceAll(" · ", ", ") : [r.setting, r.reasoning_effort].filter(Boolean).join(", ") || undefined, date, metrics: r.n == null ? undefined : { items: r.n } };
  });
}

const board: Leaderboard = {
  benchmark: "the-aggregate-exotic-fact-recall",
  url: "https://theaggregate.ai/benchmark?slug=the-aggregate-exotic-fact-recall",
  feed,
  terms: "Credit The Aggregate when quoting or charting scores. Bulk republication requires written permission. https://theaggregate.ai/terms The feed host publishes robots.txt at https://theaggregate.ai/robots.txt.",
  stats: { items: { name: 'Items', unit: 'count' } },
  async fetch() {
    return aggregateRows(feed, 'exotic-recall', 15);
  },
};
export default board;
