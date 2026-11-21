// CVDP evaluates Verilog design and verification. Mercor's embedded leaderboard contains Pass@1,
// mean score, margins and sample counts for every published reasoning effort.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
const feed = "https://www.mercor.com/apex/oss-benchmarks/oss-cvdp-leaderboard/";
const board: Leaderboard = {
  benchmark: 'cvdp',
  stats: {
    meanScore: { name: 'Mean score', unit: 'score', better: 'higher' },
    meanScoreMargin: { name: 'Mean score margin', unit: 'score', better: 'lower' },
    samples: { name: 'Samples', unit: 'count' },
  },
  url: "https://www.mercor.com/apex/oss-benchmarks/oss-cvdp-leaderboard/",
  feed,
  terms: "Mercor's robots.txt allows the public page. Mercor restricts scraping and copying under its terms. Results are credited to Mercor.",
  host: 'Mercor',
  aliases: { 'Muse Wonder 1.0': 'muse-wonder' },
  async fetch() {
    const raw = (await fetchText(feed)).match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    if (!raw) throw new Error('Mercor page data missing');
    const page = JSON.parse(raw).props.pageProps;
    if (page.benchmark.leaderboardKey !== 'oss-cvdp-leaderboard' || page.leaderboardData.length < 27) throw new Error('Incomplete CVDP data');
    return page.leaderboardData.map((r: { model_name: string; effort?: string; score: Record<string, number>; error: Record<string, number>; n_samples: number }) => {
      const score = r.score['pass-1'], margin = r.error['pass-1'];
      if (!r.model_name || !Number.isFinite(score)) throw new Error('Invalid CVDP result');
      return { model: r.model_name, setting: r.effort, score, low: score - margin, high: score + margin,
        metrics: { samples: r.n_samples, meanScore: r.score['mean-score'], meanScoreMargin: r.error['mean-score'] } };
    });
  },
};
export default board;
