// Android Bench 1.0 (Google, 100 tasks from real pull requests in open-source Android apps), replaced by
// Android Bench 2.0 in September 2026. developer.android.com/bench still shows its "1.0 task results" table:
// Model | Score (%) | CI range (%) | Avg latency (h) | Avg cost ($). Score is the score. Read through
// androidBenchTable in android-bench-2-0.ts. Avg cost is "per full benchmark run" (all 100 tasks), so it is the
// cost with costPer 'run'. Metrics: the CI range bounds (`ciLow`, `ciHigh`) and Avg latency, the hours to
// solve all 100 tasks (`runHours`).
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
      if (ci) Object.assign(metrics, { ciLow: Number(ci[1]), ciHigh: Number(ci[2]) });
      const hours = iHours < 0 ? undefined : num(r[iHours]?.text);
      if (hours !== undefined) metrics.runHours = hours;
      const cost = iCost < 0 ? undefined : num(r[iCost]?.text);
      rows.push({ ...splitEffort(r[0].text), score, cost, metrics });
    }
    return rows;
  },
};
export default board;
