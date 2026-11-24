// Mercor's extended benchmarks embed held-out results in Next.js pageProps.leaderboardData.
// Use only score, never original_score: the latter belongs to the benchmark being extended.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
interface Row { model_name: string; model_id: string; effort?: string; score: Record<string, number>; error?: Record<string, number>; n_samples?: number }
export function mercorExtended(benchmark: string, slug: string, opts?: { meanScore?: boolean }): Leaderboard {
  const url = `https://www.mercor.com/apex/mercor-extended/${slug}/`;
  return { benchmark, url, feed: `${url} (__NEXT_DATA__.props.pageProps.leaderboardData, held-out scores only)`,
    stats: {
      samples: { name: 'Samples', unit: 'count' },
      ...(opts?.meanScore ? { meanScore: { name: 'Mean score', unit: '%', better: 'higher' } } : {}),
    },
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
        const low = typeof margin === 'number' && Number.isFinite(margin) && margin >= 0 ? score - margin : undefined;
        const high = typeof margin === 'number' && Number.isFinite(margin) && margin >= 0 ? score + margin : undefined;
        if (low !== undefined && high !== undefined) { metrics.ciLow = low; metrics.ciHigh = high; }
        if (opts?.meanScore && typeof r.score?.['mean-score'] === 'number' && Number.isFinite(r.score['mean-score'])) {
          const mean = r.score['mean-score'];
          metrics.meanScore = mean;
          const meanMargin = r.error?.['mean-score'];
          if (typeof meanMargin === 'number' && Number.isFinite(meanMargin) && meanMargin >= 0) {
            metrics.meanScoreCiLow = mean - meanMargin;
            metrics.meanScoreCiHigh = mean + meanMargin;
          }
        }
        if (typeof r.n_samples === 'number') metrics.samples = r.n_samples;
        rows.push({ model: r.model_name, score, setting: r.effort || undefined, ...(low !== undefined && high !== undefined ? { low, high } : {}), metrics });
      }
      if (!rows.length) throw new Error('Mercor held-out scores missing');
      return rows;
    },
  };
}
