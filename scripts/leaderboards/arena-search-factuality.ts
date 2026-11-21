// Arena Search Factuality measures search-model answers with a factuality-adjusted Bradley-Terry rating.
// The score is the Search Arena rating at factuality weight 100, the blog's fully factuality-weighted view.
// This importer reads the embedded public search-arena data in Arena's factuality announcement.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const URL = 'https://arena.ai/blog/factuality-in-arena';
const board: Leaderboard = {
  benchmark: 'arena-search-factuality', url: URL, feed: URL,
  terms: 'Arena publishes the embedded ranking data in this public research article. Preserve Arena attribution and terms.',
  stats: {
    humanRating: { name: 'Human rating', unit: 'rating' },
  },
  async fetch() {
    const html = await fetchText(URL);
    const match = html.match(/const ARENAS = (\{.*?\});/s);
    if (!match) throw new Error('Arena factuality data missing');
    const arenas = JSON.parse(match[1].replace(/\\"/g, '"')) as { search?: Array<{ name: string; w?: Record<string, { r: number; lo?: number; hi?: number }> }> };
    const list = arenas.search;
    if (!list || list.length < 2) throw new Error('Arena search factuality rows missing');
    return list.map(entry => {
      const current = entry.w?.['100'];
      const human = entry.w?.['0'];
      if (!current || !human) throw new Error(`Arena factuality weights missing for ${entry.name}`);
      return { model: entry.name, score: current.r, low: current.lo, high: current.hi, metrics: { humanRating: human.r } } satisfies LeaderboardRow;
    });
  },
};
export default board;
