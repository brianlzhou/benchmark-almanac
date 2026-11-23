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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const systemsTable = (html: string) => tables(html).find((x) => /Systems \( \d+ \)/.test(x[0]?.map((c) => c.text).join(' | ') ?? ''));

/**
 * Reads the page up to three times. vals.ai sometimes answers with a 58 KB shell that has the menus but no table,
 * or a table whose rows haven't filled in, and the full page a few seconds later. In the afternoon sync of
 * 2026-11-23, 19 of the 43 Vals Smith boards failed their first read this way, and 16 of them read on the sync's
 * retry three minutes later.
 */
async function withRetries<T>(read: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await read();
    } catch (e) {
      if (attempt === 3) throw e;
      await wait(5000 * attempt);
    }
  }
}

export function valsSmithBoard(benchmark: string, repo: string, tokensAvailable = true): Leaderboard {
  const url = `https://www.vals.ai/vals-smith/${repo}`;
  const board: Leaderboard = {
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
    fetch: () => withRetries(async (): Promise<LeaderboardRow[]> => {
      const t = systemsTable(await fetchText(url));
      if (!t) throw new Error(`Vals Smith systems table missing for ${repo}`);
      // columns move between pages (some have no token column), so find each one by its header
      const head = t[0].map((x) => x.text);
      const col = (re: RegExp) => head.findIndex((h) => re.test(h));
      const iModel = 1, iHarness = col(/^Harness/), iScore = col(/^Score/), iCost = col(/^Cost/), iTok = col(/^Tokens/), iDur = col(/^Duration/);
      if (iScore < 0) throw new Error(`Vals Smith ${repo}: no Score column`);
      // Some pages split the tasks by type ("Task type: All types") and add a column per type between Score and
      // Cost, with the score as a percentage instead of tests passed (pingdotgg/t3code on 2026-11-23). Those
      // columns are parts.
      const typeCols = head.map((h, i) => [h.trim(), i] as const).filter(([h, i]) => i > iScore && (iCost < 0 || i < iCost) && /^[A-Z][\w ]*$/.test(h));
      const typeKey = (h: string) => h.toLowerCase().replace(/\s+(\w)/g, (_, ch: string) => ch.toUpperCase());
      if (typeCols.length) board.parts = Object.fromEntries(typeCols.map(([h]) => [typeKey(h), { name: h, group: 'Task type' }]));
      const cell = (c: string[], i: number) => (i >= 0 && c[i] && first(c[i]) !== '-' ? c[i] : undefined);
      const percent = (s: string | undefined) => (s ? first(s).match(/^(\d+(?:\.\d+)?)\s*%$/) : null);
      const rows: LeaderboardRow[] = [];
      for (const r of t.slice(1)) {
        const c = r.map((x) => x.text.trim());
        const pass = first(c[iScore] ?? '').match(/^(\d+)\s*\/\s*(\d+)$/);
        const share = percent(c[iScore]);
        if (!c[iModel] || (!pass && !share)) continue;
        const cost = cell(c, iCost) ? money(cell(c, iCost)!) : NaN;
        const metrics: Record<string, number> = pass ? { passed: Number(pass[1]), tests: Number(pass[2]) } : {};
        for (const [h, i] of typeCols) {
          const p = percent(cell(c, i));
          if (p) metrics[typeKey(h)] = Number(p[1]);
        }
        if (cell(c, iTok)) metrics.totalTokens = tokens(cell(c, iTok)!);
        if (cell(c, iDur)) metrics.minutes = minutes(cell(c, iDur)!);
        rows.push({
          // vals.ai writes OpenAI's xhigh effort as "Extra High", which the model resolver would read as "high"
          model: c[iModel].replace(/\(Extra High\)$/i, '(xhigh)'),
          harness: cell(c, iHarness) || undefined,
          score: pass ? Math.round((Number(pass[1]) / Number(pass[2])) * 10000) / 100 : Number(share![1]),
          ...(Number.isFinite(cost) && cost > 0 ? { cost } : {}),
          metrics,
        });
      }
      const listed = Number(t[0].map((x) => x.text).join(' ').match(/Systems \( (\d+) \)/)?.[1] ?? 0);
      if (rows.length < 2 || (listed && rows.length < listed)) throw new Error(`Vals Smith ${repo}: read ${rows.length} of ${listed} systems`);
      return rows;
    }),
  };
  return board;
}
