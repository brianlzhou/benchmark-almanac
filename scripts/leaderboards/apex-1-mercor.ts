// APEX-1: Mercor embeds its complete board in the Next.js page's leaderboardData.
// Preserve every Mean Score model/harness configuration, on the current 400-task extended evaluation.
// The source supplies confidence half-widths and, for some runs, sample counts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const PAGE = 'https://www.mercor.com/apex/apex-v1-leaderboard/';
interface Run {
  model_name: string; effort?: string;
  score: Record<string, Record<string, number>>;
  error?: Record<string, Record<string, number>>;
  n_samples?: number;
}
const board: Leaderboard = {
  benchmark: 'apex-1-mercor', url: PAGE, feed: `${PAGE} (__NEXT_DATA__.props.pageProps.leaderboardData)`,
  terms: 'Mercor terms forbid scraping; Benchmark Almanac credits and links Mercor as the source of these benchmark results.',
  async fetch() {
    const html = await fetchText(PAGE);
    const payload = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    if (!payload) throw new Error('Mercor Next.js payload missing');
    const data = JSON.parse(payload).props.pageProps;
    if (data.benchmark?.benchmarkId !== 'apex-v1') throw new Error('Unexpected Mercor benchmark');
    const rows: LeaderboardRow[] = [];
    for (const r of data.leaderboardData as Run[]) {
      for (const [harness, score] of Object.entries(r.score?.['mean-score'] ?? {})) {
        if (!Number.isFinite(score)) continue;
        const metrics: Record<string, number> = {};
        const ci = r.error?.['mean-score']?.[harness];
        if (typeof ci === 'number') metrics.ci95 = ci;
        if (typeof r.n_samples === 'number') metrics.samples = r.n_samples;
        rows.push({ model: r.model_name, score, setting: r.effort, harness, metrics });
      }
    }
    if (!rows.length) throw new Error('Mercor APEX-1 board has no Mean Score rows');
    return rows;
  },
};
export default board;
