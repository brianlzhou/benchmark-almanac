// ITSMBench tests policy-governed work in a stateful IT service-management tenant.
// The score is pass^1, the fraction of 53 tasks solved in one independent trial.
// This importer reads the current Enterprise Worlds leaderboard page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://enterpriseworlds.vibrantlabs.com/';

const board: Leaderboard = {
  benchmark: 'itsmbench',
  url: feed,
  feed,
  terms: 'Enterprise Worlds publishes this leaderboard for public reading. https://enterpriseworlds.vibrantlabs.com/ GitHub requests a one-second crawl delay.',
  async fetch() {
    const source = await fetchText(feed);
    const list = source.match(/<ol class="card divide-y"[\s\S]*?<\/ol>/)?.[0];
    if (!list) throw new Error('Missing ITSMBench leaderboard');
    const rows: LeaderboardRow[] = [];
    for (const item of list.matchAll(/<li class="px-4[\s\S]*?<\/li>/g)) {
      const html = item[0];
      const modelMatch = html.match(/(?:<a title="Browse [^"]+"[^>]*>|<span class="truncate[^>]+title="No trajectories[^>]*">)([^<]+)<\/(?:a|span)>/);
      const scoreMatch = html.match(/<span class="tnum ml-auto[^>]*">([0-9.]+)<\/span>/);
      if (!modelMatch || !scoreMatch) continue;
      const setting = html.match(/title="Published as &quot;([^&]+)&quot;/)?.[1];
      const score = Number(scoreMatch[1]);
      if (!Number.isFinite(score)) throw new Error('Invalid ITSMBench score');
      rows.push({ model: modelMatch[1].trim(), score, setting: setting ? `pass^1; ${setting}` : 'pass^1' });
    }
    if (rows.length < 2) throw new Error('Expected at least two ITSMBench models');
    return rows;
  },
};

export default board;
