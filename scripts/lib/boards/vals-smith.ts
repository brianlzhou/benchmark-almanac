// Vals Smith (vals.ai/vals-smith) builds a coding benchmark from one GitHub repository's merged pull requests: agents
// make each change, and hidden tests check it and test for regressions. Each repository's page has one systems table:
// model, harness, tests passed out of the total, cost, tokens and time per test. The headline is the share of tests
// passed, in percent. Only pages that compare two or more models are cataloged (2026-11-20).
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { tables } from '../html.ts';

const first = (s: string) => s.split(' , ')[0].trim();
const money = (s: string) => Number(first(s).replace(/[$,\s]/g, ''));
function tokens(s: string): number {
  const m = first(s).match(/^([\d.]+)\s*([km]?)$/i);
  if (!m) throw new Error(`Unexpected Vals Smith token count: ${s}`);
  return Number(m[1]) * (m[2].toLowerCase() === 'm' ? 1e6 : m[2].toLowerCase() === 'k' ? 1e3 : 1);
}
function minutes(s: string): number {
  const h = Number(s.match(/(\d+)\s*h/)?.[1] ?? 0), m = Number(s.match(/(\d+)\s*m(?!s)/)?.[1] ?? 0), sec = Number(s.match(/(\d+)\s*s/)?.[1] ?? 0);
  return Math.round((h * 60 + m + sec / 60) * 100) / 100;
}

export function valsSmithBoard(benchmark: string, repo: string, tokensAvailable = true): Leaderboard {
  const url = `https://www.vals.ai/vals-smith/${repo}`;
  return {
    benchmark,
    stats: {
      passed: { name: 'Tests passed', unit: 'count' },
      tests: { name: 'Tests', unit: 'count' },
      ...(tokensAvailable ? { totalTokens: { name: 'Total tokens', unit: 'tokens' } } : {}),
      minutes: { name: 'Duration', unit: 'minutes', better: 'lower' },
    },
    url,
    feed: url,
    host: 'Vals AI',
    terms: 'Vals AI publishes Vals Smith results on its public benchmark pages, credited to Vals AI. https://www.vals.ai/vals-smith',
    async fetch(): Promise<LeaderboardRow[]> {
      const t = tables(await fetchText(url)).find((x) => /Systems \( \d+ \)/.test(x[0]?.map((c) => c.text).join(' | ') ?? ''));
      if (!t) throw new Error(`Vals Smith systems table missing for ${repo}`);
      // columns move between pages (some have no token column), so find each one by its header
      const head = t[0].map((x) => x.text);
      const col = (re: RegExp) => head.findIndex((h) => re.test(h));
      const iModel = 1, iHarness = col(/^Harness/), iScore = col(/^Score/), iCost = col(/^Cost/), iTok = col(/^Tokens/), iDur = col(/^Duration/);
      if (iScore < 0) throw new Error(`Vals Smith ${repo}: no Score column`);
      const cell = (c: string[], i: number) => (i >= 0 && c[i] && first(c[i]) !== '-' ? c[i] : undefined);
      const rows: LeaderboardRow[] = [];
      for (const r of t.slice(1)) {
        const c = r.map((x) => x.text.trim());
        const pass = first(c[iScore] ?? '').match(/^(\d+)\s*\/\s*(\d+)$/);
        if (!c[iModel] || !pass) continue;
        const cost = cell(c, iCost) ? money(cell(c, iCost)!) : NaN;
        const metrics: Record<string, number> = { passed: Number(pass[1]), tests: Number(pass[2]) };
        if (cell(c, iTok)) metrics.totalTokens = tokens(cell(c, iTok)!);
        if (cell(c, iDur)) metrics.minutes = minutes(cell(c, iDur)!);
        rows.push({
          model: c[iModel],
          harness: cell(c, iHarness) || undefined,
          score: Math.round((Number(pass[1]) / Number(pass[2])) * 10000) / 100,
          ...(Number.isFinite(cost) && cost > 0 ? { cost } : {}),
          metrics,
        });
      }
      const listed = Number(t[0].map((x) => x.text).join(' ').match(/Systems \( (\d+) \)/)?.[1] ?? 0);
      if (rows.length < 2 || (listed && rows.length < listed)) throw new Error(`Vals Smith ${repo}: read ${rows.length} of ${listed} systems`);
      return rows;
    },
  };
}
