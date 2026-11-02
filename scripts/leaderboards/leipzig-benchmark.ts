// Leipzig Benchmark (100 research-level math problems). math.sciencebench.ai/benchmarks is a server-rendered
// page with dated snapshot tables for several problem sets. The Leipzig section's current "Model scores"
// table (the September 2026 re-run) has the columns Model Name | Effort | Web Search | Code Execution |
// Failures | Correct Answer, one attempt per model on all 100 problems; Correct Answer is the score. The
// effort and the tools a run had make up the setting ("max, web search, code"), since one model can appear
// with and without tools. Older snapshot tables on the page are earlier stages and are not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const URL = 'https://math.sciencebench.ai/benchmarks';

const board: Leaderboard = {
  benchmark: 'leipzig-benchmark',
  url: 'https://math.science-bench.ai/benchmarks',
  feed: `${URL} (Leipzig "Model scores" table, Correct Answer)`,
  terms: 'Server-rendered public page; the site serves no robots.txt (404) and publishes no terms.',
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'Effort') && rows[0]?.some((c) => c.text === 'Correct Answer'));
    if (!t) throw new Error('Leipzig model scores table not found');
    const h = t[0].map((c) => c.text);
    const [iModel, iEffort, iWeb, iCode, iScore] = ['Model Name', 'Effort', 'Web Search', 'Code Execution', 'Correct Answer'].map((k) => h.indexOf(k));
    return t.slice(1).map((r) => {
      const effort = (r[iEffort]?.text ?? '').split(/\s+/)[0]?.toLowerCase();
      const tools = [r[iWeb]?.text === '✓' ? 'web search' : '', r[iCode]?.text === '✓' ? 'code' : ''].filter(Boolean);
      const setting = [effort && effort !== 'default' ? effort : '', ...tools].filter(Boolean).join(', ');
      return { model: (r[iModel]?.text ?? '').replace(/\*$/, ''), score: num(r[iScore]?.text) ?? NaN, setting: setting || undefined };
    });
  },
};
export default board;
