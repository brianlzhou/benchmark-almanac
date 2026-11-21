// Android Bench 1.0 (Google, 100 tasks from real pull requests in open-source Android apps), replaced by
// Android Bench 2.0 in September 2026. developer.android.com/bench still shows its "1.0 task results" table:
// Model | Score (%) | CI range (%) | Avg latency (h) | Avg cost ($). Score is the score. Read through
// androidBenchTable in android-bench-2-0.ts. Avg cost is "per full benchmark run" (all 100 tasks), so it is the
// cost with costPer 'run'. Read the score interval and weight type. Convert mean run hours to seconds per task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num } from '../lib/html.ts';
import { ANDROID_PAGE, ANDROID_TERMS, androidBenchTable, splitEffort } from './android-bench-2-0.ts';

const board: Leaderboard = {
  benchmark: 'androidbench',
  url: ANDROID_PAGE,
  feed: `${ANDROID_PAGE} (server-rendered HTML table "1.0 task results", Score)`,
  terms: ANDROID_TERMS,
  aliases: {},
  costPer: 'run',
  stats: {
    runHours: { name: 'Average run time', unit: 'hours', better: 'lower' },
    latency: { name: 'Average latency per task', unit: 'seconds', better: 'lower' },
  },
  async fetch() {
    const { head, rows: body } = await androidBenchTable(/^Model$/, /^Score/);
    const col = (re: RegExp) => head.findIndex((h) => re.test(h));
    const [iScore, iCi, iHours, iCost] = [/^Score/, /C[lI] range/, /^Avg latency \(h\)/, /^Avg cost/].map(col);
    const rows: LeaderboardRow[] = [];
    for (const r of body) {
      const score = num(r[iScore]?.text);
      if (!r[0]?.text || score === undefined) continue;
      const metrics: Record<string, number> = {};
      const ci = r[iCi]?.text.match(/([\d.]+)\s*\S\s*([\d.]+)/);
      const weights = r[0].html.match(/\bweight___(open|closed)\b/);
      const hours = iHours < 0 ? undefined : num(r[iHours]?.text);
      if (hours !== undefined) { metrics.runHours = hours; metrics.latency = hours * 3600 / 100; }
      const cost = iCost < 0 ? undefined : num(r[iCost]?.text);
      rows.push({ ...splitEffort(r[0].text), score, cost, metrics,
        open: weights ? weights[1] === 'open' : undefined,
        low: ci ? Number(ci[1]) : undefined, high: ci ? Number(ci[2]) : undefined });
    }
    return rows;
  },
};
export default board;
