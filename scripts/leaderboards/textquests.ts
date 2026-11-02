// TextQuests (CAIS). textquests.ai is a Next.js page whose results table is a literal array in its page chunk
// (/_next/static/chunks/app/page-<hash>.js): per model, noClues and withClues objects with progress (game
// progress, percent), completed (games finished of 25) and harm (harmful actions per 100 steps). The table
// leads with the No Clues group, and the CAIS dashboard's TextQuests column is that same No Clues progress,
// so No Clues progress is the score here (higher is better). The page points to leaderboard.safe.ai for newer
// runs; the CAIS dashboard importers read those.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://www.textquests.ai/';

const board: Leaderboard = {
  benchmark: 'textquests',
  url: PAGE,
  feed: `${PAGE}_next/static/chunks/app/page-<hash>.js (results array, noClues.progress)`,
  terms: 'Public project page of the TextQuests paper; textquests.ai serves no robots.txt rules and states no terms; the textquests repository is MIT-licensed.',
  aliases: {
    'GPT-6-astra': 'gpt-6-astra',
    'GPT-5.6-sol': 'gpt-5-6-sol',
    'GPT-5.6-luna': 'gpt-5-6-luna',
    'GPT-5.6-terra': 'gpt-5-6-terra',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const src = html.match(/\/_next\/static\/chunks\/app\/page-[\w]+\.js[^"]*/)?.[0];
    if (!src) throw new Error('page chunk not found');
    const js = await fetchText(new URL(src, PAGE).href);
    const rows: LeaderboardRow[] = [];
    const re = /\{model:"([^"]+)",noClues:\{progress:([\d.]+),completed:\d+,harm:[\d.]+\}/g;
    for (const m of js.matchAll(re)) rows.push({ model: m[1], score: Number(m[2]) });
    if (rows.length < 20) throw new Error(`only ${rows.length} TextQuests rows`);
    return rows;
  },
};
export default board;
