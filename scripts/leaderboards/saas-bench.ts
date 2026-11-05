// SaaS-Bench (UniPat AI). unipat.ai/benchmarks/SaaS-Bench is server-rendered with the v1.1 results as a
// static HTML table in two groups (Generic Harness, Native Harness): Model, Harness, steps, cost and tool
// calls per task, CS (Checkpoint Score, %) and RS (Resolved Score, the share of tasks completed end to end,
// %). RS is the score, as the page's own summary and the record use it. The Harness column is the harness and
// the cost per task ("~$14.9") the cost. Steps and tool calls per task are kept in metrics as "steps" and
// "toolCalls". Group header rows are skipped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://unipat.ai/benchmarks/SaaS-Bench';

const board: Leaderboard = {
  benchmark: 'saas-bench',
  url: URL,
  feed: `${URL} (results table, RS column)`,
  terms: 'Server-rendered page on unipat.ai; robots.txt allows all paths and the site publishes no terms of use.',
  aliases: {
    'Opus 5': 'claude-opus-5',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'RS (%)') && rows[0]?.some((c) => c.text === 'Model'));
    if (!t) throw new Error('SaaS-Bench results table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iHarness, iCost, iRS] = [head.indexOf('Model'), head.indexOf('Harness'), head.indexOf('Cost / task'), head.indexOf('RS (%)')];
    const [iSteps, iCalls] = [head.indexOf('Step / task'), head.indexOf('Tool Call / task')];
    if (iModel < 0 || iRS < 0) throw new Error(`unexpected columns: ${head.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      if (r.length < head.length) continue; // group header row
      const model = r[iModel]?.text.trim();
      const score = num(r[iRS]?.text);
      if (!model || score === undefined) continue;
      const metrics: Record<string, number> = {};
      const steps = iSteps >= 0 ? num(r[iSteps]?.text) : undefined;
      const toolCalls = iCalls >= 0 ? num(r[iCalls]?.text) : undefined;
      if (steps !== undefined) metrics.steps = steps;
      if (toolCalls !== undefined) metrics.toolCalls = toolCalls;
      rows.push({
        model,
        score,
        harness: r[iHarness]?.text.trim() || undefined,
        cost: iCost >= 0 ? num(r[iCost]?.text) : undefined,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};
export default board;
