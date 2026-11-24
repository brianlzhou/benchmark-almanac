// Hyper-Intervention (Hyperstition): measures frontier models acting as token-level editor judges that inspect
// Qwen2.5-7B student rollouts, resample forks, and allocate gradient updates on MATH problems over 3-hour sessions.
// Reads the MIT-licensed per-session results CSV (reports/sessions.csv) and aggregates by judge model and reasoning
// effort to match the README summary table (mean test gain in percentage points plus inter-session SD).
// Headline spread definition quoted verbatim from README.md: "Spread between sessions (sd)" -> stored as metrics.std.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const REPO = 'https://github.com/Hyperstitioncc/HyperIntervention';
const FEED = 'https://raw.githubusercontent.com/Hyperstitioncc/HyperIntervention/main/reports/sessions.csv';

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function sampleSd(xs: number[]): number | undefined {
  if (xs.length < 2) return undefined;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

const board: Leaderboard = {
  benchmark: 'hyper-intervention',
  url: REPO,
  feed: FEED,
  terms: 'Published under the MIT license in the Hyperstitioncc/HyperIntervention GitHub repository.',
  costPer: 'run',
  stats: {
    validationGain: { name: 'Validation gain', unit: 'score', better: 'higher', note: 'Mean percentage-point gain on the 500-problem validation split across sessions.' },
    totalTokens: { name: 'Judge tokens', unit: 'tokens', better: 'lower', note: 'Mean judge tokens consumed per 3-hour post-training session.' },
    correctionsKept: { name: 'Corrections kept', unit: 'count', note: 'Mean number of token-level corrections kept per session.' },
    actions: { name: 'Actions', unit: 'count', note: 'Mean editor actions taken per session.' },
  },
  async fetch() {
    const csv = await fetchText(FEED);
    const records = parseCsv(csv);
    const groups = new Map<string, { model: string; effort: string; rows: Record<string, string>[] }>();
    for (const r of records) {
      const model = r.judge_model?.trim();
      const effort = r.reasoning_effort?.trim() || 'default';
      if (!model) continue;
      const k = `${model}::${effort}`;
      const g = groups.get(k) ?? { model, effort, rows: [] };
      g.rows.push(r);
      groups.set(k, g);
    }
    const out: LeaderboardRow[] = [];
    for (const g of groups.values()) {
      const gains = g.rows.map((r) => Number(r.test_gain_points)).filter(Number.isFinite);
      const valGains = g.rows.map((r) => Number(r.validation_gain_points)).filter(Number.isFinite);
      const costs = g.rows.map((r) => Number(r.judge_usd)).filter(Number.isFinite);
      const toks = g.rows.map((r) => Number(r.judge_tokens)).filter(Number.isFinite);
      const corrs = g.rows.map((r) => Number(r.corrections_kept)).filter(Number.isFinite);
      const acts = g.rows.map((r) => Number(r.actions)).filter(Number.isFinite);
      if (!gains.length) continue;
      const metrics: Record<string, number> = {};
      const sd = sampleSd(gains);
      if (sd !== undefined) metrics.std = Number(sd.toFixed(2));
      if (valGains.length) metrics.validationGain = Number(mean(valGains).toFixed(2));
      if (toks.length) metrics.totalTokens = Math.round(mean(toks));
      if (corrs.length) metrics.correctionsKept = Number(mean(corrs).toFixed(1));
      if (acts.length) metrics.actions = Number(mean(acts).toFixed(1));
      out.push({
        model: g.model,
        setting: g.effort !== 'default' ? `${g.effort} reasoning` : undefined,
        score: Number(mean(gains).toFixed(2)),
        cost: costs.length ? Number(mean(costs).toFixed(2)) : undefined,
        trials: gains.length,
        metrics,
      });
    }
    if (out.length < 5) throw new Error(`Hyper-Intervention returned only ${out.length} rows`);
    return out;
  },
};
export default board;
