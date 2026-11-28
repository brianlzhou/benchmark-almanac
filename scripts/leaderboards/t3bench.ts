// T3Bench text-to-3D generation leaderboard from the official project page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const URL = 'https://t3bench.com/';

function parseNum(raw: string): number | undefined {
  const n = Number(raw.trim());
  return Number.isFinite(n) ? n : undefined;
}

const board: Leaderboard = {
  benchmark: 't3bench',
  url: URL,
  feed: URL,
  terms: 'The T3Bench authors publish the benchmark leaderboard publicly on t3bench.com.',
  headline: 'Average quality and alignment score across single-object, single-object-with-surroundings, and multi-object prompts.',
  parts: {
    singleObject: 'Single object',
    singleWithSurroundings: 'Single with surroundings',
    multiObject: 'Multi object',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(URL);
    const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
    if (!tableMatch) throw new Error('T3Bench leaderboard table not found');

    const bodyMatch = tableMatch[0].match(/<tbody[\s\S]*?<\/tbody>/i);
    const source = bodyMatch ? bodyMatch[0] : tableMatch[0];

    const rows: LeaderboardRow[] = [];
    for (const tr of source.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => text(c[1]));
      if (cells.length < 6) continue;

      const model = cells[1].trim();
      const score = parseNum(cells[2]);
      if (!model || score === undefined) continue;

      const metrics: Record<string, number> = {};
      const singleObject = parseNum(cells[3]);
      const singleWithSurroundings = parseNum(cells[4]);
      const multiObject = parseNum(cells[5]);
      if (singleObject !== undefined) metrics.singleObject = singleObject;
      if (singleWithSurroundings !== undefined) metrics.singleWithSurroundings = singleWithSurroundings;
      if (multiObject !== undefined) metrics.multiObject = multiObject;

      rows.push({
        model,
        score,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }

    if (rows.length < 5) {
      throw new Error(`Expected at least 5 rows on T3Bench leaderboard, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
