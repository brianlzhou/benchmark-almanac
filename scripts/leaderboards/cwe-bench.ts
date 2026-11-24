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
  parts: {
    A01: { name: 'A01 Broken Access Control', group: 'Category' },
    A02: { name: 'A02 Security Misconfiguration', group: 'Category' },
    A03: { name: 'A03 Software Supply Chain Failures', group: 'Category' },
    A04: { name: 'A04 Cryptographic Failures', group: 'Category' },
    A05: { name: 'A05 Injection', group: 'Category' },
    A06: { name: 'A06 Insecure Design', group: 'Category' },
    A07: { name: 'A07 Authentication Failures', group: 'Category' },
    A08: { name: 'A08 Software or Data Integrity Failures', group: 'Category' },
    A09: { name: 'A09 Security Logging and Alerting Failures', group: 'Category' },
    A10: { name: 'A10 Mishandling of Exceptional Conditions', group: 'Category' },
    'C/C++': { name: 'C/C++', group: 'Language' },
    Go: { name: 'Go', group: 'Language' },
    Java: { name: 'Java', group: 'Language' },
    'JS/TS': { name: 'JS/TS', group: 'Language' },
    Python: { name: 'Python', group: 'Language' },
    Rust: { name: 'Rust', group: 'Language' },
  },
  stats: {
    passAt4: { name: 'Programmatic pass@4', unit: '%', better: 'higher' },
    judgePassAt1: { name: 'Judge panel pass@1', unit: '%', better: 'higher' },
    judgePassAt4: { name: 'Judge panel pass@4', unit: '%', better: 'higher' },
  },
  url: URL,
  feed: `${URL} (leaderboard table, Programmatic Pass@1)`,
  terms: 'Static public page; robots.txt allows every agent and invites crawling, citing and quoting, and the site publishes no terms.',
  aliases: {},
  async fetch() {
    const html = await fetchText(URL);
    const allTables = tables(html);
    const t = allTables.find((rows) => rows[0]?.some((c) => /^Programmatic$/i.test(c.text)));
    if (!t) throw new Error('CWE-bench leaderboard table not found');
    const head = t[0].map((c) => c.text);
    const sub = t[1].map((c) => c.text);
    if (head[1] !== 'Model' || head[2] !== 'Harness' || head[3] !== 'Programmatic' || !/^Pass@1/.test(sub[0]) || !/^Pass@4/.test(sub[1] ?? '') || !/^Avg cost/.test(head[5] ?? '')) {
      throw new Error(`unexpected CWE-bench header: ${head.join(' | ')} / ${sub.join(' | ')}`);
    }
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const ciByModel = new Map<string, number>();
    for (const m of html.matchAll(/<tr\b[^>]*data-model="([^"]+)"[^>]*data-p1ci="([\d.]+)"/g)) {
      ciByModel.set(norm(m[1]), Number(m[2]));
    }
    const extraByModel = new Map<string, Record<string, number>>();
    const catTable = allTables.find((rows) => rows[0]?.[0]?.text === 'Category' && rows[1]?.[0]?.text?.startsWith('A01'));
    if (catTable) {
      const models = catTable[0].slice(1).map((c) => c.text);
      for (const r of catTable.slice(1)) {
        const key = r[0]?.text.match(/^(A\d{2})\b/)?.[1];
        if (!key) continue;
        models.forEach((model, i) => {
          const v = num(r[i + 1]?.text);
          if (v !== undefined) (extraByModel.get(model) ?? extraByModel.set(model, {}).get(model)!)[key] = v;
        });
      }
    }
    const langTable = allTables.find((rows) => rows[0]?.[0]?.text === 'Language' && rows[1]?.[0]?.text === 'C/C++');
    if (langTable) {
      const models = langTable[0].slice(1).map((c) => c.text);
      for (const r of langTable.slice(1)) {
        const key = r[0]?.text;
        if (!key) continue;
        models.forEach((model, i) => {
          const v = num(r[i + 1]?.text);
          if (v !== undefined) (extraByModel.get(model) ?? extraByModel.set(model, {}).get(model)!)[key] = v;
        });
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      if (r.length !== 8) continue;
      const score = num(r[3].text);
      const model = r[1].text;
      if (!model || score === undefined) continue;
      const metrics: Record<string, number> = { ...(extraByModel.get(model) ?? {}) };
      const pass4 = num(r[4].text);
      const judge1 = num(r[5].text);
      const judge4 = num(r[6].text);
      if (pass4 !== undefined) metrics.passAt4 = pass4;
      if (judge1 !== undefined) metrics.judgePassAt1 = judge1;
      if (judge4 !== undefined) metrics.judgePassAt4 = judge4;
      const ci = ciByModel.get(norm(model));
      rows.push({
        model,
        score,
        low: ci !== undefined ? Math.max(0, Number((score - ci).toFixed(1))) : undefined,
        high: ci !== undefined ? Math.min(100, Number((score + ci).toFixed(1))) : undefined,
        harness: r[2].text || undefined,
        cost: num(r[7].text),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    if (!rows.length) throw new Error('no rows in the CWE-bench table');
    return rows;
  },
};
export default board;
