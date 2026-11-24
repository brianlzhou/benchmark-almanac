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
const parseTok = (s: string) => {
  const m = s.match(/([\d.]+)\s*([KMB])/i);
  if (!m) return undefined;
  const u = m[2].toUpperCase();
  return Number(m[1]) * (u === 'B' ? 1e9 : u === 'M' ? 1e6 : 1e3);
};

const board: Leaderboard = {
  benchmark: 'leipzig-benchmark',
  url: 'https://math.science-bench.ai/benchmarks',
  feed: `${URL} (Leipzig "Model scores" table, Correct Answer)`,
  terms: 'Server-rendered public page; the site serves no robots.txt (404) and publishes no terms.',
  stats: {
    failures: { name: 'Failures', unit: 'count', better: 'lower', note: 'Runs that returned no answer due to an API error or timeout.' },
    totalTokens: { name: 'Total tokens per problem', unit: 'tokens', better: 'lower', note: 'Average total tokens per problem across the 100 problems.' },
    inputTokens: { name: 'Input tokens per problem', unit: 'tokens', better: 'lower', note: 'Average input tokens per problem across the 100 problems.' },
    attempts: { name: 'Solver attempts', unit: 'count', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const rawHtml = await fetchText(URL);
    const rawTable = tables(rawHtml).find((rows) => rows[0]?.some((c) => c.text.startsWith('Effort')) && rows[0]?.some((c) => c.text === 'Correct Answer'));
    const html = rawHtml.replace(/<span\b[^>]*role="tooltip"[^>]*>[\s\S]*?<\/span>/g, '');
    const t = tables(html).find((rows) => rows[0]?.some((c) => c.text === 'Effort') && rows[0]?.some((c) => c.text === 'Correct Answer'));
    if (!t) throw new Error('Leipzig model scores table not found');
    const h = t[0].map((c) => c.text);
    const [iModel, iEffort, iWeb, iCode, iFail, iScore, iTokens] = ['Model Name', 'Effort', 'Web Search', 'Code Execution', 'Failures', 'Correct Answer', 'Tokens'].map((k) => h.indexOf(k));
    return t.slice(1).map((r, idx) => {
      const effort = (r[iEffort]?.text ?? '').split(/\s+/)[0]?.toLowerCase();
      const tools = [r[iWeb]?.text === '✓' ? 'web search' : '', r[iCode]?.text === '✓' ? 'code' : ''].filter(Boolean);
      const setting = [effort && effort !== 'default' ? effort : '', ...tools].filter(Boolean).join(', ');
      const metrics: Record<string, number> = {};
      if (iFail >= 0) {
        const failText = r[iFail]?.text ?? '';
        const failNum = num(failText);
        metrics.failures = failNum !== undefined ? failNum : /ndash|mdash|[–—-]/.test(failText) ? 0 : NaN;
        if (!Number.isFinite(metrics.failures)) delete metrics.failures;
      }
      let tokens: number | undefined;
      if (iTokens >= 0) {
        const tokVis = r[iTokens]?.text ?? '';
        const tokRaw = rawTable?.[idx + 1]?.[iTokens]?.text ?? tokVis;
        const total = parseTok(tokVis);
        const inp = tokRaw.match(/([\d.]+\s*[KMB])\s*input/i);
        const out = tokRaw.match(/([\d.]+\s*[KMB])\s*output/i);
        const att = tokRaw.match(/(\d+)\s+solver attempts/i);
        if (total !== undefined) metrics.totalTokens = Math.round(total / 100);
        if (inp) { const v = parseTok(inp[1]); if (v !== undefined) metrics.inputTokens = Math.round(v / 100); }
        if (out) { const v = parseTok(out[1]); if (v !== undefined) tokens = Math.round(v / 100); }
        if (att) metrics.attempts = Number(att[1]);
      }
      return {
        model: (r[iModel]?.attrs['data-value'] ?? r[iModel]?.text ?? '').replace(/\*$/, ''),
        score: num(r[iScore]?.text) ?? NaN,
        setting: setting || undefined,
        tokens,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      };
    });
  },
};
export default board;
