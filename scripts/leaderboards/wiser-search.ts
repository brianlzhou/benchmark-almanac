// WISER-Search combines fresh and customer-inspired web-research questions for agent search systems.
// This importer reads the three JSON result arrays in Parallel's public article. The score is answer accuracy in
// percent, and the x value is the article's total cost per query in cents.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://parallel.ai/blog/search-api-benchmark';
const FEED = 'https://parallel.ai/blog/search-api-benchmark.md';
interface Result { label: string; x: number; y: number; yDisplay?: number }
function readResults(markdown: string): Result[] {
  const section = markdown.match(/### Search MCP Benchmark[\s\S]*?(?=\*\*The results show|$)/)?.[0];
  if (!section) throw new Error('WISER-Search: benchmark section missing');
  const blocks = [...section.matchAll(/```\s*\n([\s\S]*?)\n```/g)];
  if (blocks.length < 3) throw new Error('WISER-Search: result arrays missing');
  const results = blocks.slice(0, 3).flatMap((block) => JSON.parse(block[1]) as Result[]);
  if (results.length !== 12) throw new Error(`WISER-Search: found ${results.length} rows, expected 12`);
  if (results.some((r) => typeof r.label !== 'string' || !Number.isFinite(r.x) || !Number.isFinite(r.y))) throw new Error('WISER-Search: invalid result row');
  return results;
}
const board: Leaderboard = {
  benchmark: 'wiser-search', url: PAGE, feed: FEED,
  stats: { costPerQueryCents: { name: 'Cost per query', unit: 'usd', better: 'lower' } },
  terms: 'The benchmark is public and the article provides its reported result arrays. Results are credited to Parallel Web Systems.',
  headline: 'Answer accuracy on the blended WISER-Fresh and WISER-Atomic test set',
  fetch: async () => (await readResults(await fetchText(FEED))).map((r): LeaderboardRow => ({ model: r.label, score: r.y, metrics: { costPerQueryCents: r.x } })),
};
export default board;
