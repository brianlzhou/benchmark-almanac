// The Tuesday Work Index is the composite chart on Surge's benchmarks page.
// Its data-ii-* attributes are distinct from the individual benchmark preview tables below it.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';
import { SURGE_TERMS, SURGE_ALIASES } from '../lib/boards/surgehq-cov2.ts';
const URL = 'https://surgehq.ai/benchmarks';
const board: Leaderboard = {
  benchmark: 'tuesday-work-index', url: URL, feed: `${URL} (Tuesday Work Index data-ii-item chart)`, terms: SURGE_TERMS, aliases: { ...SURGE_ALIASES, 'Muse Wonder 1.0': 'muse-wonder' },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(URL);
    const rows: LeaderboardRow[] = [];
    for (const part of html.split('data-ii-item=""').slice(1)) {
      const model = part.match(/<p\b[^>]*data-ii-model-bound=""[^>]*>([\s\S]*?)<\/p>/)?.[1];
      const score = part.match(/<p\b[^>]*data-ii-score-paragraph=""[^>]*>([\s\S]*?)<\/p>/)?.[1];
      const effort = part.match(/<p\b[^>]*data-ii-reasoning-bound=""[^>]*>([\s\S]*?)<\/p>/)?.[1];
      if (model && score && Number.isFinite(Number(text(score)))) rows.push({ model: text(model), score: Number(text(score)), setting: effort ? text(effort).toLowerCase() : undefined });
    }
    if (!rows.length) throw new Error('Tuesday Work Index chart rows missing');
    return rows;
  },
};
export default board;
