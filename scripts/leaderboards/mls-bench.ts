// MLS-Bench. mls-bench.com/leaderboard is server-rendered (Next.js) with one HTML table: Model (with an
// Open or Closed badge), Harness (with its effort badge) and Performance. The page states the board is the
// MLS-Bench-Lite score (the 30-task subset, run through Harbor with a 5-hour budget per task), the
// figure labs cite. Above 50 beats the strongest human baseline. Badges are dropped from the model name,
// and the harness effort becomes the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const URL = 'https://mls-bench.com/leaderboard';

const board: Leaderboard = {
  benchmark: 'mls-bench',
  url: URL,
  feed: `${URL} (server-rendered HTML table, MLS-Bench-Lite Performance)`,
  terms: 'Server-rendered public page; the site publishes no robots.txt and no terms.',
  aliases: {},
  async fetch() {
    const html = await fetchText(URL);
    if (!/MLS-Bench-Lite/i.test(html)) throw new Error('the board no longer says it shows MLS-Bench-Lite');
    const t = tables(html).find((rows) => rows[0]?.some((c) => c.text === 'Performance'));
    if (!t) throw new Error('MLS-Bench table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iHarness, iScore] = [head.indexOf('Model'), head.indexOf('Harness'), head.indexOf('Performance')];
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      // the name is the first span after the vendor logo. The Open or Closed badge is a later span
      const spans = [...(r[iModel]?.html ?? '').matchAll(/<span[^>]*>([^<]+)<\/span>/g)].map((m) => text(m[1]));
      const model = spans.find((s) => !/^(open|closed)$/i.test(s));
      // "Claude Code max ( with fallback )": the effort badge sits inside the harness text
      const harnessText = r[iHarness]?.text ?? '';
      const effort = harnessText.match(/\b(max|xhigh|high|medium|low)\b/i)?.[1];
      const harness = (effort ? harnessText.replace(effort, '') : harnessText).replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s+/g, ' ').trim();
      const score = num(r[iScore]?.text);
      if (!model || score === undefined) continue;
      rows.push({ model, score, harness: harness || undefined, setting: effort?.toLowerCase() });
    }
    return rows;
  },
};
export default board;
