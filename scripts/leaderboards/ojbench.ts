// OJBench. he-ren.github.io/OJBench-Leaderboard/ is a static page whose script holds the data as a literal
// array, rawData: per model, overall [Python pass@1, Python pass@8, C++ pass@1, C++ pass@8] and pass rates
// by difficulty. The page sorts by C++ pass@1 and shows C++ first, so C++ pass@1 is the score here (labs
// that cite OJBench sometimes report the Python column instead). The array is read as data, never run. The
// other three overall columns go in `metrics`: "cppPass8", "pyPass1" and "pyPass8" (%).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const PAGE = 'https://he-ren.github.io/OJBench-Leaderboard/';

const board: Leaderboard = {
  benchmark: 'ojbench',
  url: PAGE,
  feed: `${PAGE} (inline rawData array, C++ pass@1)`,
  terms: 'Static GitHub Pages site that states no license or terms; the OJBench repository is AGPL-3.0 (code).',
  aliases: {
    // keyed without the effort so the resolver keeps "thinking" as the setting
    'Kimi-2.5': 'kimi-k2-5',
    'Gemini-3.0-pro': 'gemini-3-pro',
    'Minimax-m2.5': 'minimax-m2-5',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const at = html.indexOf('const rawData = [');
    if (at < 0) throw new Error('no rawData array on the OJBench page');
    const data = jsLiteral<{ name: string; overall: (string | null)[] }[]>(html, html.indexOf('[', at));
    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      const score = Number(r.overall?.[2]);
      if (!r.name || r.overall?.[2] == null || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      for (const [k, i] of [['pyPass1', 0], ['pyPass8', 1], ['cppPass8', 3]] as const) {
        const v = r.overall[i] == null ? NaN : Number(r.overall[i]);
        if (Number.isFinite(v)) metrics[k] = v;
      }
      rows.push({ model: r.name, score, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    return rows;
  },
};
export default board;
