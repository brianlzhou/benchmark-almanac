// CORE-Bench Hard on the Holistic Agent Leaderboard (HAL, Princeton). The page is server-rendered with one
// table: Rank | Scaffold | Primary Model | Verified | Accuracy | Cost (USD) | Runs | Traces. Accuracy (0 to
// 100, sometimes followed by a note on manual validation) is the score and the scaffold the harness. The
// cost column is the total for the run, but the page warns (2026-10-05) that some rows, not all, count each
// API response twice, so it is not kept until HAL re-derives it. Model names may end in a release
// note ("Claude Sonnet 4.5 (September 2025)"), which is dropped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const URL = 'https://hal.cs.princeton.edu/corebench_hard';

const board: Leaderboard = {
  benchmark: 'core-bench',
  url: URL,
  feed: `${URL} (leaderboard table)`,
  terms: 'Server-rendered public page of the Princeton HAL project; the site has no robots.txt restrictions or terms, and the HAL harness is open source.',
  verified: 'reproduced by the HAL team',
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(URL)).find((x) => /^Scaffold/.test(x[0]?.[1]?.text ?? '') && /^Primary Model/.test(x[0]?.[2]?.text ?? ''));
    if (!t) throw new Error('HAL CORE-Bench table not found');
    const head = t[0].map((c) => c.text);
    const iScore = head.findIndex((h) => /^Accuracy/.test(h));
    const iVerified = head.findIndex((h) => /^Verified/.test(h));
    const iRuns = head.findIndex((h) => /^Runs/.test(h));
    const iTraces = head.findIndex((h) => /^Traces/.test(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const scaffold = text(r[1]?.html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? '');
      const subMatch = r[1]?.text.match(/Submitted by\s+(.+?)(?:\s+Download\b|\s+Pareto\b|$)/i);
      const submitter = subMatch?.[1]?.trim();
      const model = text(r[2]?.html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? r[2]?.text ?? '').replace(/\s*\((?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4}\)$/, '');
      const score = num(r[iScore]?.text);
      if (!model || score === undefined) continue;
      const verified = iVerified >= 0 && r[iVerified]?.text.includes('✓') ? true : undefined;
      const runs = iRuns >= 0 ? num(r[iRuns]?.text) : undefined;
      const traceHref = iTraces >= 0 ? r[iTraces]?.html.match(/<a\b[^>]*href="([^"]+)"/i)?.[1] : undefined;
      const link = traceHref && /^https?:\/\//i.test(traceHref) ? traceHref : undefined;
      rows.push({
        model,
        score,
        harness: scaffold || undefined,
        ...(submitter ? { submitter } : {}),
        ...(verified ? { verified } : {}),
        ...(runs !== undefined && runs > 0 ? { trials: runs } : {}),
        ...(link ? { link } : {}),
      });
    }
    if (!rows.length) throw new Error('no rows in the HAL CORE-Bench table');
    return rows;
  },
};
export default board;
