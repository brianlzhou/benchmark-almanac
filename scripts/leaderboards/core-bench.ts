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
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(URL)).find((x) => /^Scaffold/.test(x[0]?.[1]?.text ?? '') && /^Primary Model/.test(x[0]?.[2]?.text ?? ''));
    if (!t) throw new Error('HAL CORE-Bench table not found');
    const iScore = t[0].findIndex((c) => /^Accuracy/.test(c.text));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const scaffold = text(r[1]?.html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? '');
      const model = text(r[2]?.html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? r[2]?.text ?? '').replace(/\s*\((?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4}\)$/, '');
      const score = num(r[iScore]?.text);
      if (!model || score === undefined) continue;
      rows.push({ model, score, harness: scaffold || undefined });
    }
    if (!rows.length) throw new Error('no rows in the HAL CORE-Bench table');
    return rows;
  },
};
export default board;
