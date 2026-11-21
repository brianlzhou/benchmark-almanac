// WISER-Atomic is Parallel's private web-research benchmark of customer-inspired questions across several domains.
// This importer reads the two JSON result arrays in Parallel's public article. The score is answer accuracy in percent,
// and the x value is the article's cost per 1,000 questions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://parallel.ai/blog/parallel-task-api';
const FEED = 'https://parallel.ai/blog/parallel-task-api.md';
interface Result { label: string; x: number; y: number }
function readResults(markdown: string): Result[] {
  const section = markdown.match(/### WISER-Atomic[\s\S]*?(?=### SimpleQA|$)/)?.[0];
  if (!section) throw new Error('WISER-Atomic: benchmark section missing');
  const blocks = [...section.matchAll(/```\s*\n([\s\S]*?)\n```/g)];
  if (blocks.length < 2) throw new Error('WISER-Atomic: result arrays missing');
  const results = blocks.slice(0, 2).flatMap((block) => JSON.parse(block[1]) as Result[]);
  if (results.length !== 11) throw new Error(`WISER-Atomic: found ${results.length} rows, expected 11`);
  if (results.some((r) => typeof r.label !== 'string' || !Number.isFinite(r.x) || !Number.isFinite(r.y))) throw new Error('WISER-Atomic: invalid result row');
  return results;
}
const board: Leaderboard = {
  benchmark: 'wiser-atomic', url: PAGE, feed: FEED,
  terms: 'The benchmark is private and the public article provides its reported result arrays. Results are credited to Parallel Web Systems.',
  headline: 'Answer accuracy on 121 customer-inspired web-research questions',
  fetch: async () => (await readResults(await fetchText(FEED))).map((r): LeaderboardRow => ({ model: r.label, score: r.y, metrics: { costPer1000Questions: r.x } })),
};
export default board;
