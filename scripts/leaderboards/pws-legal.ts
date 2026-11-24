// PWS-Legal is Parallel's private legal research benchmark with 238 held-out questions.
// The headline score is the reported answer accuracy percentage, where higher is better.
// This importer reads the benchmark's JSON result arrays in the public Markdown article.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://parallel.ai/blog/parallel-for-legal';
const FEED = 'https://parallel.ai/blog/parallel-for-legal.md';

interface Result { label: string; x: number; y: number }

function readResults(markdown: string): Result[] {
  const section = markdown.match(/### PWS-Legal[\s\S]*?(?=### |$)/)?.[0];
  if (!section) throw new Error('PWS-Legal: benchmark section missing');
  const blocks = [...section.matchAll(/```\s*\n([\s\S]*?)\n```/g)];
  if (blocks.length < 2) throw new Error('PWS-Legal: result arrays missing');
  const results = blocks.flatMap((block) => JSON.parse(block[1]) as Result[]);
  if (results.length !== 7) throw new Error(`PWS-Legal: found ${results.length} rows, expected 7`);
  if (results.some((r) => typeof r.label !== 'string' || !Number.isFinite(r.x) || !Number.isFinite(r.y))) {
    throw new Error('PWS-Legal: result row has invalid fields');
  }
  return results;
}

const board: Leaderboard = {
  benchmark: 'pws-legal',
  url: PAGE,
  feed: FEED,
  terms: 'The benchmark is private and the public article provides its reported result table. Results are credited to Parallel Web Systems.',
  headline: 'Answer accuracy on 238 held-out legal questions',
  stats: { costPer1000Questions: { name: 'Cost per 1,000 questions', unit: 'usd', better: 'lower' } },
  chart: {
    title: 'Accuracy versus cost per 1,000 questions',
    x: { key: 'costPer1000Questions', label: 'Cost per 1,000 questions', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Accuracy', unit: '%', better: 'higher' },
    note: 'Parallel Web Systems plots answer accuracy against end-to-end cost per 1,000 questions.',
  },
  fetch: async () => (await readResults(await fetchText(FEED))).map((r): LeaderboardRow => ({
    model: r.label,
    score: r.y,
    cost: r.x / 1000,
    metrics: { costPer1000Questions: r.x },
  })),
};

export default board;
