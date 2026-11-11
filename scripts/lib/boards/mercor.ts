// Mercor's extended benchmarks embed held-out results in Next.js pageProps.leaderboardData.
// Use only score, never original_score: the latter belongs to the benchmark being extended.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
interface Row { model_name: string; model_id: string; effort?: string; score: Record<string, number>; error?: Record<string, number>; n_samples?: number }
export function mercorExtended(benchmark: string, slug: string): Leaderboard {
  const url = `https://www.mercor.com/apex/mercor-extended/${slug}/`;
  return { benchmark, url, feed: `${url} (__NEXT_DATA__.props.pageProps.leaderboardData, held-out scores only)`,
    terms: 'Mercor terms prohibit automated scraping; the almanac credits Mercor and links the original source.',
    aliases: { 'Muse Wonder 1.0': 'muse-wonder', 'Kimi K2.7 Code': 'kimi-k2-7-code' },
    async fetch(): Promise<LeaderboardRow[]> {
      const html = await fetchText(url);
      const raw = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
      if (!raw) throw new Error('Mercor Next.js data missing');
      const page = JSON.parse(raw).props.pageProps;
      if (page.benchmark.leaderboardKey !== slug) throw new Error('Mercor benchmark key changed');
      const rows: LeaderboardRow[] = [];
      for (const r of page.leaderboardData as Row[]) {
        const score = r.score?.['pass-1'] ?? r.score?.['mean-score'];
        if (!Number.isFinite(score)) continue;
        const metrics: Record<string, number> = {};
        const margin = r.error?.['pass-1'] ?? r.error?.['mean-score'];
        if (typeof margin === 'number') { metrics.ciLow = score - margin; metrics.ciHigh = score + margin; }
        if (typeof r.n_samples === 'number') metrics.samples = r.n_samples;
        rows.push({ model: r.model_name, score, setting: r.effort || undefined, metrics });
      }
      if (!rows.length) throw new Error('Mercor held-out scores missing');
      return rows;
    },
  };
}
