// OpenWorldEngineer (OWE-Bench): Mercor embeds its board in the Next.js page's pageProps.leaderboard.rows.
// The headline score is Mean@8: each task's eight attempts averaged, then the 26 tasks averaged. Best@8 and the
// board's Elo go in metrics, with the 95% interval across tasks that Mercor reports for Mean@8.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const PAGE = 'https://www.mercor.com/apex/open-world-engineer-leaderboard/';
interface Run {
  model_name: string;
  model_id?: string;
  effort?: string;
  score: Record<string, number>;
  error?: Record<string, number>;
}
const board: Leaderboard = {
  benchmark: 'owe-bench',
  url: PAGE,
  feed: `${PAGE} (__NEXT_DATA__.props.pageProps.leaderboard.rows)`,
  terms: 'Mercor terms forbid scraping; Benchmark Almanac credits and links Mercor as the source of these benchmark results.',
  // the board uses short names ("Opus 5.5", "Beam", "Inkling")
  aliases: {
    'Opus 5.5': 'claude-opus-5-5',
    'Sonnet 5.5': 'claude-sonnet-5-5',
    'Fable 5.1': 'claude-fable-5-1',
    'Fable 5.2': 'claude-fable-5-2',
    'GPT-6 Astra': 'gpt-6-astra',
    'GPT-6.1 Sol': 'gpt-6-1-sol',
    'Gemini 4 Argon': 'gemini-4-argon',
    'Gemini 4 Carbon': 'gemini-4-carbon',
    'GLM-5.3': 'glm-5-3',
    'Grok 4.7': 'grok-4-7',
    'Kimi K3.1 Pro': 'kimi-k3-1-pro',
    'DeepSeek-V4.1-Flash': 'deepseek-v4-1-flash',
    Beam: 'beam-1-0',
    Inkling: 'inkling',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const payload = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    if (!payload) throw new Error('Mercor Next.js payload missing');
    const page = JSON.parse(payload).props.pageProps;
    if (!/OpenWorldEngineer/.test(page.hero?.title ?? '')) throw new Error('Unexpected Mercor benchmark');
    const rows: LeaderboardRow[] = [];
    for (const r of (page.leaderboard?.rows ?? []) as Run[]) {
      const score = r.score?.['mean-8'];
      if (!Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      if (Number.isFinite(r.score['best-8'])) metrics.best8 = r.score['best-8'];
      if (Number.isFinite(r.score.elo)) metrics.elo = r.score.elo;
      if (typeof r.error?.['mean-8'] === 'number') metrics.ci95 = r.error['mean-8'];
      rows.push({ model: r.model_name, score, setting: r.effort || undefined, metrics });
    }
    if (rows.length < 5) throw new Error(`Mercor OWE-Bench board has only ${rows.length} Mean@8 rows`);
    return rows;
  },
};
export default board;
