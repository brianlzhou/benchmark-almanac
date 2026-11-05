// CWE-bench (Collinear AI) on cwe-bench.com, v1 (120 held-out audit-and-patch tasks). Since v2 launched on
// 2026-11-02 the site's root page shows v2 (250 tasks, not comparable), and v1 lives at /v1. That page is
// static HTML whose first table has a two-row header: # Rank | Model | Harness | Programmatic (Pass@1,
// Pass@4) | Judge panel (Pass@1, Pass@4) | Avg cost / rollout. The body rows therefore have eight cells. The
// programmatic pass@1 (a deterministic exploit check, 0 to 100) is the headline the launch posts cite, the
// programmatic pass@4 is kept as metrics.passAt4, and the cost per rollout is kept as the cost of one task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://cwe-bench.com/v1';

const board: Leaderboard = {
  benchmark: 'cwe-bench',
  url: URL,
  feed: `${URL} (leaderboard table, Programmatic Pass@1)`,
  terms: 'Static public page; robots.txt allows every agent and invites crawling, citing and quoting, and the site publishes no terms.',
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => /^Programmatic$/i.test(c.text)));
    if (!t) throw new Error('CWE-bench leaderboard table not found');
    const head = t[0].map((c) => c.text);
    const sub = t[1].map((c) => c.text);
    if (head[1] !== 'Model' || head[2] !== 'Harness' || head[3] !== 'Programmatic' || !/^Pass@1/.test(sub[0]) || !/^Pass@4/.test(sub[1] ?? '') || !/^Avg cost/.test(head[5] ?? '')) {
      throw new Error(`unexpected CWE-bench header: ${head.join(' | ')} / ${sub.join(' | ')}`);
    }
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      if (r.length !== 8) continue;
      const score = num(r[3].text);
      if (!r[1].text || score === undefined) continue;
      const pass4 = num(r[4].text);
      rows.push({ model: r[1].text, score, harness: r[2].text || undefined, cost: num(r[7].text), metrics: pass4 === undefined ? undefined : { passAt4: pass4 } });
    }
    if (!rows.length) throw new Error('no rows in the CWE-bench table');
    return rows;
  },
};
export default board;
