// Rapidata's Multi-Step Image Edit benchmark measures identity drift after five image edits.
// Its headline score is an Elo rating from pairwise human preferences, where higher means less identity drift.
// The importer reads the ranked model table from the public benchmark.ai page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const URL = 'https://www.benchmark.ai/multi-step-image-edit';
const FEED = URL;
const TERMS = 'The benchmark data and derived results are published under CC BY-SA 4.0. Results are credited to Rapidata.';

function readRows(html: string): LeaderboardRow[] {
  const rows: LeaderboardRow[] = [];
  for (const match of html.matchAll(/<button class="grid[^>]*>([\s\S]*?)<\/button>/g)) {
    const body = match[1];
    const model = body.match(/title="([^"]+)">[^<]*<\/span>/)?.[1];
    const organization = body.match(/truncate font-sans">([^<]+)<\/div>/)?.[1];
    const scoreText = body.match(/text-xs text-foreground font-semibold font-times">(\d+)<\/span>/)?.[1];
    const interval = body.match(/text-\[11px\][^>]*>±(\d+)<\/span>/)?.[1];
    const responses = body.match(/text-xs font-normal text-ink font-times">([0-9,]+)<\/span>/)?.[1];
    const winRate = body.match(/text-xs font-normal text-ink font-times">([0-9.]+)%<\/span>/)?.[1];
    if (!model || !organization || !scoreText || !interval || !responses || !winRate) continue;
    const score = Number(scoreText);
    const margin = Number(interval);
    rows.push({
      model,
      score,
      low: score - margin,
      high: score + margin,
      submitter: organization,
      metrics: {
        responses: Number(responses.replace(/,/g, '')),
        winRate: Number(winRate),
      },
    });
  }
  if (rows.length < 10) throw new Error(`Rapidata Multi-Step Image Edit: only ${rows.length} ranked rows`);
  return rows;
}

const board: Leaderboard = {
  benchmark: 'rapidata-multi-step-image-edit',
  url: URL,
  feed: FEED,
  terms: TERMS,
  fetch: async () => readRows(await fetchText(FEED)),
};

export default board;
