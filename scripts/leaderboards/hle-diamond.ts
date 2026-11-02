// HLE-Diamond. The Center for AI Safety's lastexam.ai post "Introducing HLE-Diamond" is a Next.js page whose
// ResultsView component shows accuracy without tools at two reasoning settings. Its default view, "All
// models are evaluated with reasoning high" (GPT-6 Astra 59.9), comes from an object in the page's own
// chunk (app/blog/hle-diamond/page-<hash>.js: b = JSON.parse('{"model": [overall, reasoning, knowledge]}')).
// The "See reasoning max" view is the Model | Accuracy table passed to ResultsView in the page's flight data.
// Both are imported, with setting "high" and "max"; the with-tools table is a different setting and is not
// read. Every score is overall accuracy on the 1,000 questions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter, num } from '../lib/html.ts';

const SITE = 'https://lastexam.ai';
const PAGE = `${SITE}/blog/hle-diamond`;

const board: Leaderboard = {
  benchmark: 'hle-diamond',
  url: PAGE,
  feed: `${PAGE} (page chunk object "b" for reasoning high; flight-data ResultsView table for reasoning max)`,
  terms: 'Public CAIS blog page; lastexam.ai serves no robots.txt (the path returns 404) and publishes no terms page.',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const rows: LeaderboardRow[] = [];

    const chunkPath = html.match(/\/_next\/static\/chunks\/app\/blog\/hle-diamond\/page-[\w]+\.js/)?.[0];
    if (!chunkPath) throw new Error('HLE-Diamond page chunk not found');
    const chunk = await fetchText(`${SITE}${chunkPath}`);
    const high = chunk.match(/=JSON\.parse\('(\{"[^']*?":\[[\d.]+,[\d.]+,[\d.]+\][^']*)'\)/);
    if (!high) throw new Error('reasoning-high scores not found in the page chunk');
    for (const [model, v] of Object.entries(JSON.parse(high[1]) as Record<string, number[]>)) rows.push({ model, score: v[0], setting: 'high' });

    const max = jsonAfter<{ headers: string[]; rows: string[][] }>(nextFlight(html), '{"headers":["Model","Accuracy"]');
    for (const [model, acc] of max.rows) {
      const score = num(acc);
      if (score !== undefined) rows.push({ model, score, setting: 'max' });
    }
    return rows;
  },
};
export default board;
