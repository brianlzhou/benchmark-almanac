// IUK v1.5 ranks models by a weighted composite across four instrumentation tiers.
// RelayForge archives the combined leaderboard and per-tier results in its public JSON release.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://huggingface.co/datasets/ryan-relayforge/iuk-benchmark/resolve/main/results/v1.5/benchmark_v1.5.json";
interface Entry {
  model_name: string; composite_score: number; provider: string; highest_tier_passed: number;
  per_tier: Record<string,{score_pct: number; correct: number; total_questions: number; safety_failures: number; api_errors: number}>;
}

const board: Leaderboard = {
  benchmark: "iuk-1-5",
  url: "https://www.relayforge.tools/dawes/#v15-archive",
  feed,
  terms: "RelayForge licenses its aggregate results under CC BY 4.0 with attribution. https://www.relayforge.tools/dawes/ Hugging Face allows the archive feed in robots.txt.",
  parts: {t1: 'T1: Technician', t2: 'T2: Engineer', t3: 'T3: Specialist', t4: 'T4: Expert'},
  async fetch() {
    const d = await fetchJson<{version:string; models_total:number; combined_leaderboard:Entry[]}>(feed);
    if (d.version !== 'v1.5' || d.combined_leaderboard.length !== d.models_total || d.models_total < 15) throw new Error('Incomplete IUK v1.5 leaderboard');
    return d.combined_leaderboard.map(row => {
      if (!row.model_name || !Number.isFinite(row.composite_score)) throw new Error('Invalid IUK composite');
      const metrics: Record<string,number> = { highestTierPassed: row.highest_tier_passed };
      for (const key of ['t1','t2','t3','t4']) {
        const t = row.per_tier[key];
        if (!t || !Number.isFinite(t.score_pct)) throw new Error('Missing IUK tier ' + key);
        metrics[key] = t.score_pct;
        metrics[key+'SafetyFailures'] = t.safety_failures;
        metrics[key+'ApiErrors'] = t.api_errors;
      }
      return { model: row.model_name, score: row.composite_score, setting: row.provider, metrics };
    });
  },
};
export default board;
