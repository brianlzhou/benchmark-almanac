// PWS-Finance is Parallel's private finance research benchmark with 174 held-out questions.
// The headline score is the reported answer accuracy percentage, where higher is better.
// This importer reads the benchmark's JSON result arrays in the public Markdown article.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://parallel.ai/blog/parallel-for-finance';
const FEED = 'https://parallel.ai/blog/parallel-for-finance.md';

interface Result { label: string; x: number; y: number }

function readResults(markdown: string): Result[] {
  const section = markdown.match(/### PWS-Finance[\s\S]*?(?=### |$)/)?.[0];
  if (!section) throw new Error('PWS-Finance: benchmark section missing');
  const blocks = [...section.matchAll(/```\s*\n([\s\S]*?)\n```/g)];
  if (blocks.length < 2) throw new Error('PWS-Finance: result arrays missing');
  const results = blocks.flatMap((block) => JSON.parse(block[1]) as Result[]);
  if (results.length !== 5) throw new Error(`PWS-Finance: found ${results.length} rows, expected 5`);
  if (results.some((r) => typeof r.label !== 'string' || !Number.isFinite(r.x) || !Number.isFinite(r.y))) {
    throw new Error('PWS-Finance: result row has invalid fields');
  }
  return results;
}

const board: Leaderboard = {
  benchmark: 'pws-finance',
  url: PAGE,
  feed: FEED,
  terms: 'The benchmark is private and the public article provides its reported result table. Results are credited to Parallel Web Systems.',
  headline: 'Answer accuracy on 174 held-out finance questions',
  stats: { costPer1000Questions: { name: 'Cost per 1,000 questions', unit: 'usd', better: 'lower' } },
  fetch: async () => (await readResults(await fetchText(FEED))).map((r): LeaderboardRow => ({
    model: r.label,
    score: r.y,
    metrics: { costPer1000Questions: r.x },
  })),
};

export default board;
