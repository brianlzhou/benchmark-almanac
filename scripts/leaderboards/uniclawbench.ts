// UniClawBench. uniclawbench.github.io is a static export of the ClawBench web UI: results.json holds one
// row per task attempt (harness, model slug, category, task, score 0 to 1, passed, tokens), and the page
// aggregates in the browser. Its default "Model" tab keeps only OpenClaw runs, groups them by model and
// sorts by pass rate. The importer does the same, so the score is the share of OpenClaw attempts passed
// (0 to 100) and the mean output tokens per attempt are kept. The tab's other figures are kept as metrics: the
// mean attempt score (`avgScore`, 0 to 100) and the mean runtime_ms in seconds (`latency`).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://uniclawbench.github.io/results.json';

interface Attempt {
  backend: string;
  model_slug: string;
  passed?: boolean;
  score?: number | null;
  completion_tokens?: number | null;
  runtime_ms?: number | null;
}

const board: Leaderboard = {
  benchmark: 'uniclawbench',
  url: 'https://uniclawbench.github.io/#/leaderboard/model',
  feed: `${FEED} (OpenClaw attempts, pass rate per model, as the Model tab computes)`,
  terms: 'Static results file on the UniClawBench GitHub Pages site that the page loads; the page states no terms.',
  aliases: {
    'qwen3.5-plus': 'qwen-3-5-plus-hosted-397b-a17b',
  },
  async fetch() {
    const { rows } = await fetchJson<{ rows: Attempt[] }>(FEED);
    const groups = new Map<string, { n: number; pass: number; tok: number; toks: number; score: number; ms: number; mss: number }>();
    for (const r of rows) {
      if (r.backend !== 'openclaw' || !r.model_slug) continue;
      const g = groups.get(r.model_slug) ?? { n: 0, pass: 0, tok: 0, toks: 0, score: 0, ms: 0, mss: 0 };
      g.n++;
      if (r.passed) g.pass++;
      // the page averages score over all attempts and runtime over those that have one
      g.score += r.score ?? 0;
      if (typeof r.runtime_ms === 'number') {
        g.ms += r.runtime_ms;
        g.mss++;
      }
      if (typeof r.completion_tokens === 'number') {
        g.tok += r.completion_tokens;
        g.toks++;
      }
      groups.set(r.model_slug, g);
    }
    const out: LeaderboardRow[] = [];
    for (const [model, g] of groups) {
      const metrics: Record<string, number> = { avgScore: (100 * g.score) / g.n };
      if (g.mss) metrics.latency = g.ms / g.mss / 1000;
      out.push({ model, score: (100 * g.pass) / g.n, harness: 'OpenClaw', tokens: g.toks ? g.tok / g.toks : undefined, metrics });
    }
    return out;
  },
};
export default board;
